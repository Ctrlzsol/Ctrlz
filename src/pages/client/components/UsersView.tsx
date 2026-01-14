
import React, { useState } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClientProfile, ClientUser } from '../../../core/types';

interface UsersViewProps {
    client: ClientProfile;
    users: ClientUser[];
    onAddUser: (u: ClientUser) => void;
    onUpdateUser: (u: ClientUser) => void;
    onDeleteUser: (userId: string) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ client, users, onAddUser, onUpdateUser }) => {
    const [newUser, setNewUser] = useState({ name: '', email: '', position: '', phone: '', anyDeskId: '' });
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    
    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        
        if (editingUserId) {
            onUpdateUser({ 
                id: editingUserId, 
                clientId: client.id, 
                ...newUser 
            });
            setEditingUserId(null);
        } else {
            onAddUser({ 
                id: `u-${Date.now()}`, 
                clientId: client.id, 
                ...newUser 
            }); 
        }
        
        setNewUser({ name: '', email: '', position: '', phone: '', anyDeskId: '' }); 
        setShowForm(false); 
    };

    const startEdit = (user: ClientUser) => {
        setNewUser({ 
            name: user.name, 
            email: user.email, 
            position: user.position, 
            phone: user.phone, 
            anyDeskId: user.anyDeskId || '' 
        });
        setEditingUserId(user.id);
        setShowForm(true);
    };
    
    const remainingSlots = Math.max(0, client.totalUsersLimit - users.length);
    
    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-[#0c2444]">فريق العمل</h3>
                    <p className="text-sm text-gray-500 mt-1">يمكنك إضافة حتى {client.totalUsersLimit} عضو. المتبقي: <span className="font-bold text-[#0071e3]">{remainingSlots}</span></p>
                </div>
                {(remainingSlots > 0 || editingUserId) && (
                    <button 
                        onClick={() => { setShowForm(!showForm); setEditingUserId(null); setNewUser({ name: '', email: '', position: '', phone: '', anyDeskId: '' }); }} 
                        className="bg-[#0c2444] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#0a1f3b] flex items-center gap-2"
                    >
                        <Plus size={16} /> {showForm ? 'إغلاق' : 'إضافة عضو'}
                    </button>
                )}
            </div>
            
            <AnimatePresence>
                {showForm && (
                    <motion.form 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        onSubmit={handleSubmit} 
                        className="bg-gray-50 p-6 rounded-2xl mb-8 overflow-hidden border border-gray-100"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input required placeholder="اسم الموظف" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} className="p-3 rounded-xl border border-gray-200 bg-white text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100" />
                            <input required placeholder="المسمى الوظيفي" value={newUser.position} onChange={e => setNewUser({...newUser, position: e.target.value})} className="p-3 rounded-xl border border-gray-200 bg-white text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100" />
                            <input type="email" placeholder="البريد الإلكتروني" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="p-3 rounded-xl border border-gray-200 bg-white text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100" />
                            <input placeholder="رقم الهاتف" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} className="p-3 rounded-xl border border-gray-200 bg-white text-[#0c2444] outline-none focus:ring-2 focus:ring-blue-100" />
                            <input placeholder="AnyDesk ID (رقم المكتب البعيد)" value={newUser.anyDeskId} onChange={e => setNewUser({...newUser, anyDeskId: e.target.value})} className="p-3 rounded-xl border border-gray-200 bg-white text-[#0c2444] col-span-2 font-mono outline-none focus:ring-2 focus:ring-blue-100" />
                        </div>
                        <button type="submit" className="bg-[#0071e3] text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-[#005bb5] w-full md:w-auto">
                            {editingUserId ? 'حفظ التعديلات' : 'حفظ وإضافة'}
                        </button>
                    </motion.form>
                )}
            </AnimatePresence>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {users.length === 0 && <p className="col-span-2 text-center text-gray-400 py-8">لا يوجد أعضاء في فريق العمل.</p>}
                {users.map(u => (
                    <div key={u.id} className="p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow bg-white flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#f5f5f7] rounded-full flex items-center justify-center text-gray-500 font-bold text-lg">{u.name.charAt(0)}</div>
                            <div>
                                <h4 className="font-bold text-[#0c2444]">{u.name}</h4>
                                <p className="text-xs text-[#0071e3] font-bold">{u.position}</p>
                                <p className="text-xs text-gray-400 mt-1 font-mono">AnyDesk: {u.anyDeskId || '-'}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(u)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                <Edit2 size={16}/>
                            </button>
                            {/* Delete Button Removed as Requested */}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default UsersView;
