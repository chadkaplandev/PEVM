'use client'

import React, { useState, useEffect } from 'react';
import { Calendar, Users, Plus, Edit2, Trash2, X, Save, LogOut, Lock, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PeopleEventsManager() {
  const [people, setPeople] = useState([]);
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('people');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const credentials = {
    admin: { username: 'admin', password: 'admin123', role: 'admin' },
    member: { username: 'member', password: 'member123', role: 'member' }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setIsLoggedIn(true);
      setUserRole(user.role);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      loadData();
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    const { username, password } = loginForm;
    const user = Object.values(credentials).find(
      cred => cred.username === username && cred.password === password
    );

    if (user) {
      setIsLoggedIn(true);
      setUserRole(user.role);
      setLoginError('');
      localStorage.setItem('currentUser', JSON.stringify({ role: user.role, username: user.username }));
      loadData();
    } else {
      setLoginError('Invalid username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    setLoginForm({ username: '', password: '' });
    localStorage.removeItem('currentUser');
  };

  const loadData = async () => {
    const { data: peopleData } = await supabase.from('people').select('*').order('created_at', { ascending: false });
    const { data: eventsData } = await supabase.from('events').select('*').order('date', { ascending: true });
    setPeople(peopleData || []);
    setEvents(eventsData || []);
  };

  const calculateAge = (birthday) => {
    if (!birthday) return '';
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculateYearsMarried = (anniversary) => {
    if (!anniversary) return '';
    const today = new Date();
    const anniversaryDate = new Date(anniversary);
    let years = today.getFullYear() - anniversaryDate.getFullYear();
    const monthDiff = today.getMonth() - anniversaryDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < anniversaryDate.getDate())) {
      years--;
    }
    return years;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData({ ...formData, image: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    if (userRole !== 'admin') return;
    setEditingItem(null);
    setImagePreview(null);
    setFormData(activeTab === 'people' 
      ? { name: '', spouse: '', anniversary: '', birthday: '', home_phone: '', cell_phone: '', email: '', living_development: '', address: '', image: '' }
      : { title: '', date: '', location: '', description: '', attendees: '' }
    );
    setShowModal(true);
  };

  const openEditModal = (item) => {
    if (userRole !== 'admin') return;
    setEditingItem(item);
    setFormData(item);
    setImagePreview(item.image || null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (userRole !== 'admin') return;
    
    const table = activeTab === 'people' ? 'people' : 'events';
    
    if (editingItem) {
      await supabase.from(table).update(formData).eq('id', editingItem.id);
    } else {
      await supabase.from(table).insert([formData]);
    }
    
    await loadData();
    setShowModal(false);
    setImagePreview(null);
  };

  const handleDelete = async (id) => {
    if (userRole !== 'admin') return;
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const table = activeTab === 'people' ? 'people' : 'events';
    await supabase.from(table).delete().eq('id', id);
    await loadData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isFormValid = () => {
    if (activeTab === 'people') {
      return formData.name && formData.name.trim() !== '';
    } else {
      return formData.title && formData.title.trim() !== '' && formData.date;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="text-blue-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access the dashboard</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter your username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                placeholder="Enter your password"
              />
            </div>

            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {loginError}
              </div>
            )}

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Sign In
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-xs">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-gray-800 mb-1">Admin Access:</p>
                <p className="text-gray-700">Username: <span className="font-mono bg-white px-2 py-1 rounded">admin</span></p>
                <p className="text-gray-700">Password: <span className="font-mono bg-white px-2 py-1 rounded">admin123</span></p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-semibold text-gray-800 mb-1">Member Access (View Only):</p>
                <p className="text-gray-700">Username: <span className="font-mono bg-white px-2 py-1 rounded">member</span></p>
                <p className="text-gray-700">Password: <span className="font-mono bg-white px-2 py-1 rounded">member123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Management Dashboard</h1>
              <p className="text-gray-600">
                {userRole === 'admin' ? 'Admin Access - Full Control' : 'Member Access - View Only'}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('people')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'people'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users size={20} />
              Members ({people.length})
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'events'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={20} />
              Events ({events.length})
            </button>
          </div>

          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'people' ? 'Members' : 'Events'}
              </h2>
              {userRole === 'admin' && (
                <button
                  onClick={openAddModal}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={20} />
                  Add {activeTab === 'people' ? 'Member' : 'Event'}
                </button>
              )}
            </div>

            {activeTab === 'people' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {people.length === 0 ? (
                  <div className="col-span-full text-center py-12 text-gray-500">
                    No members added yet. {userRole === 'admin' && 'Click "Add Member" to get started!'}
                  </div>
                ) : (
                  people.map(person => (
                    <div key={person.id} className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                      <div className="flex items-start gap-4 mb-4">
                        {person.image ? (
                          <img src={person.image} alt={person.name} className="w-20 h-20 rounded-full object-cover border-2 border-blue-500" />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="text-gray-400" size={32} />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xl font-bold text-gray-900">{person.name}</h3>
                            {userRole === 'admin' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openEditModal(person)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(person.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </div>
                          {person.spouse && (
                            <p className="text-sm text-gray-600 mt-1">Spouse: {person.spouse}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        {person.anniversary && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Anniversary:</span>
                            <span className="text-gray-800">{formatDate(person.anniversary)} <span className="text-blue-600 font-semibold">({calculateYearsMarried(person.anniversary)} years)</span></span>
                          </div>
                        )}
                        {person.birthday && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Birthday:</span>
                            <span className="text-gray-800">{formatDate(person.birthday)} <span className="text-blue-600 font-semibold">({calculateAge(person.birthday)} years old)</span></span>
                          </div>
                        )}
                        {person.home_phone && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Home:</span>
                            <span className="text-gray-800">{person.home_phone}</span>
                          </div>
                        )}
                        {person.cell_phone && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cell:</span>
                            <span className="text-gray-800">{person.cell_phone}</span>
                          </div>
                        )}
                        {person.email && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Email:</span>
                            <span className="text-gray-800 truncate">{person.email}</span>
                          </div>
                        )}
                        {person.living_development && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Development:</span>
                            <span className="text-gray-800">{person.living_development}</span>
                          </div>
                        )}
                        {person.address && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <span className="text-gray-600 block mb-1">Address:</span>
                            <span className="text-gray-800">{person.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No events added yet. {userRole === 'admin' && 'Click "Add Event" to get started!'}
                  </div>
                ) : (
                  events.map(event => (
                    <div key={event.id} className="bg-gradient-to-r from-white to-indigo-50 rounded-lg p-6 shadow hover:shadow-md transition-shadow border border-indigo-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="bg-blue-600 text-white rounded-lg p-3 text-center min-w-16">
                              <div className="text-2xl font-bold">{new Date(event.date).getDate()}</div>
                              <div className="text-xs uppercase">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>
                              <div className="space-y-1 text-sm text-gray-600">
                                {event.date && <p>📅 {formatDate(event.date)}</p>}
                                {event.location && <p>📍 {event.location}</p>}
                                {event.attendees && <p>👥 {event.attendees} attendees</p>}
                              </div>
                              {event.description && (
                                <p className="mt-3 text-gray-700">{event.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {userRole === 'admin' && (
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => openEditModal(event)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Edit2 size={20} />
                            </button>
                            <button
                              onClick={() => handleDelete(event.id)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingItem ? 'Edit' : 'Add'} {activeTab === 'people' ? 'Member' : 'Event'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {activeTab === 'people' ? (
                <div className="space-y-4">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-blue-500" />
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="text-gray-400" size={48} />
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                        <Upload size={20} />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Name *</label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Spouse</label>
                      <input
                        type="text"
                        value={formData.spouse || ''}
                        onChange={(e) => setFormData({ ...formData, spouse: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Anniversary</label>
                      <input
                        type="date"
                        value={formData.anniversary || ''}
                        onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Birthday</label>
                      <input
                        type="date"
                        value={formData.birthday || ''}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Home Phone</label>
                      <input
                        type="tel"
                        value={formData.home_phone || ''}
                        onChange={(e) => setFormData({ ...formData, home_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Cell Phone</label>
                      <input
                        type="tel"
                        value={formData.cell_phone || ''}
                        onChange={(e) => setFormData({ ...formData, cell_phone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Living Development</label>
                      <input
                        type="text"
                        value={formData.living_development || ''}
                        onChange={(e) => setFormData({ ...formData, living_development: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <textarea
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows="2"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      value={formData.location || ''}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Attendees</label>
                    <input
                      type="text"
                      value={formData.attendees || ''}
                      onChange={(e) => setFormData({ ...formData, attendees: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid()}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isFormValid()
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Save size={18} />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}