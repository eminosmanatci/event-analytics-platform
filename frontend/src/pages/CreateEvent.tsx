import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { eventApi } from '../lib/api';

export default function CreateEvent() {
  const [formData, setFormData] = useState({
    event_type: '',
    user_id: '',
    metadata: '{}',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

      await eventApi.create({
        event_type: formData.event_type,
        user_id: parseInt(formData.user_id),
        metadata,
      });

      setSuccess(true);
      setFormData({ event_type: '', user_id: '', metadata: '{}' });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Event</h2>

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Event created successfully!
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
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
            placeholder="e.g., user_login, task_created"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            User ID
          </label>
          <input
            type="number"
            value={formData.user_id}
            onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
            placeholder="e.g., 1"
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
          {loading ? 'Creating...' : 'Create Event'}
        </button>
      </form>
    </div>
  );
}