'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { users } from './users';

export default function Home() {
  const [selectedUser, setSelectedUser] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (selectedUser === 'Adminbbt') {
      const password = prompt('Enter password:');
      if (password === 'bbt191') {
        router.push('/admin');
      } else {
        alert('Incorrect password');
      }
    } else if (users.includes(selectedUser)) {
      router.push(`/user/${encodeURIComponent(selectedUser)}`);
    } else {
      alert('Invalid user');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
        <h1 className="text-2xl font-semibold mb-4 text-center text-black">Login</h1>
        <select
          className="w-full p-2 border rounded mb-4 text-black"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="" >Select your name</option>
          <option value="Adminbbt">Admin</option>
          {users.map((user) => (
            <option key={user} value={user}>{user}</option>
          ))}
        </select>
        <button
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          onClick={handleLogin}
        >
          Login
        </button>
      </div>
    </main>
  );
}
