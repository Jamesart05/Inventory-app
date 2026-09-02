'use client';

import RequireAuth from '@/components/RequireAuth';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';
import ItemForm from '@/components/ItemForm';

export default function NewItemPage() {
  return (
    <RequireAuth>
      <TopBar title="Add item" />
      <div className="container">
        <ItemForm mode="create" />
      </div>
      <BottomNav />
    </RequireAuth>
  );
}
