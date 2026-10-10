import { useCallback } from "react";
import api from "../api";
import usePaginated from "../hooks/usePaginated";
import Modal from "./Modal";
import Sentinel from "./Sentinel";
import UserListItem from "./UserListItem";

export default function LikersModal({ kind, id, onClose }) {
  const fetchPage = useCallback(
    async (page) => {
      const res = await api.get(`/${kind}s/${id}/likes`, { params: { page, limit: 20 } });
      return { items: res.data.users, hasMore: res.data.hasMore };
    },
    [kind, id]
  );
  const { items, loading, hasMore, loadMore } = usePaginated(fetchPage, `${kind}-${id}`);

  return (
    <Modal title="Likes" onClose={onClose}>
      <div className="modal-list">
        {items.map((u) => (
          <UserListItem key={u._id} user={u} onNavigate={onClose} />
        ))}
        {!loading && items.length === 0 && <p className="empty-text">No likes yet.</p>}
        {loading && <p className="loading-text">Loading...</p>}
        <Sentinel onVisible={loadMore} disabled={!hasMore || loading} />
      </div>
    </Modal>
  );
}
