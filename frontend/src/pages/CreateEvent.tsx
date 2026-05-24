import { useState, useEffect } from 'react';
import { Send, CheckCircle, User } from 'lucide-react';
import { eventApi, api } from '../lib/api'; // ← NAMED IMPORT!

interface UserData {
  id: number;
  username: string;
  email: string;
}

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    event_type: '',
    metadata: '{}',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);

  // Login olmuş kullanıcının bilgilerini al
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token);

        if (!token) {
          console.log('No token');
          return;
        }

        console.log('Fetching user...');
        const response = await api.get('/auth/me');
        console.log('User data:', response.data);

        if (response.data) {
          setCurrentUser(response.data);
        }
      } catch (err: any) {
        console.error('Error:', err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
        }
        setCurrentUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      let metadata = {};
      try {
        metadata = JSON.parse(formData.metadata);
      } catch {
        metadata = {};
      }

      const payload: any = {
        event_type: formData.event_type,
        metadata,
      };

      if (currentUser?.id) {
        payload.user_id = currentUser.id;
        console.log('Adding user_id:', currentUser.id);
      }

      console.log('Payload:', payload);
      await eventApi.create(payload);

      setSuccess(true);
      setFormData({ event_type: '', metadata: '{}' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
        {currentUser && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm">
            <User className="w-4 h-4" />
            <span>@{currentUser.username} (#{currentUser.id})</span>
          </div>
        )}
      </div>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Event created successfully!
          {currentUser && (
            <span className="text-sm text-green-600 ml-1">
              (as User #{currentUser.id})
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {!currentUser && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          You are not logged in. Event will be created anonymously.
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <input
            type="text"
            value={formData.event_type}
            onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
            placeholder="e.g., user_login, button_click"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Metadata (JSON)
          </label>
          <textarea
            value={formData.metadata}
            onChange={(e) => setFormData({ ...formData, metadata: e.target.value })}
            placeholder='{"device": "mobile", "os": "ios"}'
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all font-mono text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Creating...' : currentUser ? `Send Event (as @${currentUser.username})` : 'Send Event (Anonymous)'}
        </button>
      </form>
    </div>
  );
}