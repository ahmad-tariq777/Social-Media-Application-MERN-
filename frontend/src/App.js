import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { BadgeProvider } from "./context/BadgeContext";
import GuestRoute from "./components/GuestRoute";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Register from "./components/Register";
import ReelsFeed from "./components/ReelsFeed";
import RequireAuth from "./components/RequireAuth";
import ChatPage from "./pages/ChatPage";
import ContentDetail from "./pages/ContentDetail";
import Explore from "./pages/Explore";
import Feed from "./pages/Feed";
import FollowersList from "./pages/FollowersList";
import FollowingList from "./pages/FollowingList";
import Hashtag from "./pages/Hashtag";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import SearchResults from "./pages/SearchResults";
import Settings from "./pages/Settings";
import Suggestions from "./pages/Suggestions";
import "./styles/Common.css";
import "./App.css";

export default function App() {
  return (
    <AuthProvider>
      <BadgeProvider>
        <Router>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route path="/feed" element={<Feed />} />
                <Route path="/explore" element={<Explore />} />
                <Route path="/reels" element={<ReelsFeed />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/hashtag/:tag" element={<Hashtag />} />
                <Route path="/post/:id" element={<ContentDetail kind="post" />} />
                <Route path="/reel/:id" element={<ContentDetail kind="reel" />} />
                <Route path="/profile/:id" element={<Profile />} />
                <Route path="/followers/:id" element={<FollowersList />} />
                <Route path="/following/:id" element={<FollowingList />} />
                <Route path="/suggestions" element={<Suggestions />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </Router>
      </BadgeProvider>
    </AuthProvider>
  );
}
