# Styles you need to write

The JSX only imports CSS files and uses classNames. Nothing is styled in JS.

## New CSS files you must create in `src/styles/`

- `Common.css` (imported by: Avatar.jsx, GuestRoute.jsx, PostGrid.jsx, RequireAuth.jsx, RichText.jsx, Sentinel.jsx, UserListItem.jsx, UserName.jsx)
- `Explore.css` (imported by: Explore.jsx, Hashtag.jsx, SearchResults.jsx)
- `Modal.css` (imported by: Modal.jsx)
- `Notifications.css` (imported by: Notifications.jsx)
- `Settings.css` (imported by: Settings.jsx)
- `Stories.css` (imported by: StoriesBar.jsx, StoryViewer.jsx)

`Common.css` is also imported in `App.js`. Every other CSS file imported by the JSX already exists in your `src/styles/` folder.

## classNames used per file

### components/Avatar.jsx
CSS: Common.css

`avatar-fallback`

### components/CommentItem.jsx
CSS: CommentSection.css

`comment-avatar`, `comment-content`, `comment-edit`, `comment-edited`, `comment-item`, `comment-meta`, `comment-pinned`, `comment-text`, `comment-time`, `comment-top`, `comment-username`, `delete`, `like-btn`, `loading-text`, `meta-btn`, `replies`, `reply-box`, `view-replies`

### components/CommentModal.jsx
CSS: CommentModal.css

`close`, `comment-modal`, `modal-content`

### components/CommentSection.jsx
CSS: CommentSection.css

`add-comment`, `comment-input`, `comment-section`, `comment-send`, `comment-sort`, `comments-list`, `comments-off`, `empty-text`, `load-more`, `loading-text`

### components/CreatePost.jsx
CSS: Createpost.css

`actions`, `caption-input`, `create-post-card`, `create-post-top`, `file-upload`, `location-input`, `post-btn`, `preview`, `preview-list`, `preview-media`, `remove-btn`, `toggle-comments`

### components/EditProfileModal.jsx
CSS: profile.css, EditProfileModal.css

`check-row`, `controls`, `cover`, `crop-buttons`, `crop-container`, `crop-modal`, `delete-btn`, `edit-profile-modal`, `error`, `form-message`, `image-picker`, `modal`, `modal-actions`, `modal-backdrop`, `pick-btn`, `preview-img`, `spinner`, `upload-input`, `upload-section`, `uploading-overlay`

### components/FollowButton.jsx
CSS: profile.css

`follow-btn`, `follow-btn-`

### components/GuestRoute.jsx
CSS: Common.css

`page-loading`

### components/Layout.jsx
CSS: -

`app-main`

### components/LikersModal.jsx
CSS: -

`empty-text`, `loading-text`, `modal-list`

### components/Login.jsx
CSS: Login.css

`error`, `input-icon`, `input-toggle`, `input-with-icon`, `login-container`, `login-footer`, `login-msg`

### components/MediaCarousel.jsx
CSS: PostCard.css

`carousel-btn`, `carousel-dot`, `carousel-dots`, `media-carousel`, `next`, `post-media`, `prev`

### components/Modal.jsx
CSS: Modal.css

`modal-backdrop`, `modal-body`, `modal-close`, `modal-header`, `modal-title`

### components/Navbar.jsx
CSS: Navbar.css

`badge`, `icon-btn`, `logo`, `logout-btn`, `logout-icon`, `menu-toggle`, `nav-link`, `navbar`, `navbar-center`, `navbar-left`, `navbar-middle`, `navbar-right`, `search-all`, `search-bar`, `search-clear`, `search-hash-icon`, `search-result-item`, `search-result-sub`, `search-result-text`, `search-results`

### components/PostCard.jsx
CSS: PostCard.css

`action-btn`, `archived-tag`, `avatar`, `caption-edit`, `caption-edit-actions`, `comments-link`, `danger`, `icon-action`, `likes-link`, `pin-icon`, `post-actions`, `post-author`, `post-body`, `post-caption`, `post-card`, `post-header`, `post-header-text`, `post-location`, `post-menu`, `post-menu-wrap`, `post-stats`, `post-sub`, `post-time`, `primary-btn`, `save-btn`, `secondary-btn`, `shares-count`

### components/PostGrid.jsx
CSS: Common.css

`grid-badges`, `grid-media`, `grid-overlay`, `grid-text`, `grid-tile`, `post-grid`

### components/ReelCard.jsx
CSS: ReelCard.css

`actions`, `avatar`, `caption`, `delete-btn`, `icon-btn`, `info`, `mute-btn`, `overlay`, `play-overlay`, `reel-author`, `reel-card`, `reel-video`, `reel-views`, `user`, `username`

### components/ReelsFeed.jsx
CSS: ReelsFeed.css

`empty-text`, `loading-text`, `reels-feed`, `reels-list`, `reels-tabs`, `reels-toolbar`, `upload-reel-btn`

### components/Register.jsx
CSS: Register.css

`input-icon`, `input-toggle`, `input-with-icon`, `register-container`, `register-footer`, `register-msg`

### components/ReportModal.jsx
CSS: -

`form-message`, `modal-actions`, `primary-btn`, `report-details`, `report-form`, `report-option`, `secondary-btn`

### components/RequireAuth.jsx
CSS: Common.css

`page-loading`

### components/RichText.jsx
CSS: Common.css

`hashtag`, `mention`

### components/Sentinel.jsx
CSS: Common.css

`sentinel`

### components/ShareModal.jsx
CSS: -

`empty-text`, `error`, `form-message`, `loading-text`, `modal-actions`, `modal-list`, `primary-btn`, `share-chat`, `share-chat-name`, `share-copy`

### components/StoriesBar.jsx
CSS: Stories.css

`stories-bar`, `story-add`, `story-item`, `story-name`, `story-ring`

### components/StoryViewer.jsx
CSS: Stories.css

`danger`, `empty-text`, `story-action`, `story-caption`, `story-close`, `story-footer`, `story-frame`, `story-header`, `story-liked-by`, `story-media`, `story-media-wrap`, `story-nav`, `story-next`, `story-prev`, `story-progress`, `story-time`, `story-viewer`, `story-viewer-row`, `story-viewers`, `story-viewers-header`, `story-viewers-list`

### components/UploadReel.jsx
CSS: UploadReel.css

`error`, `form-message`, `primary-btn`, `progress`, `toggle-comments`, `upload-drop`, `upload-preview`, `upload-reel`

### components/UserListItem.jsx
CSS: Common.css

`user-item`, `user-item-actions`, `user-item-link`, `user-item-sub`, `user-item-text`

### components/UserName.jsx
CSS: Common.css

`verified-icon`

### components/chat/ChatList.jsx
CSS: ChatPage.css

`chat-avatar`, `chat-avatar-wrap`, `chat-info`, `chat-info-bottom`, `chat-info-top`, `chat-item`, `chat-items`, `chat-name`, `chat-preview`, `chat-search`, `chat-sidebar`, `chat-sidebar-header`, `chat-time`, `empty-text`, `loading-text`, `muted-icon`, `new-chat-btn`, `online-dot`, `unread-badge`

### components/chat/ChatWindow.jsx
CSS: ChatPage.css

`attach-btn`, `chat-back`, `chat-composer-context`, `chat-header`, `chat-header-avatar`, `chat-header-menu`, `chat-header-text`, `chat-input`, `chat-messages`, `chat-status`, `context-item`, `context-preview`, `danger`, `empty-text`, `load-older`, `loading-text`, `message-menu`, `send-btn`, `typing-indicator`

### components/chat/GroupInfoModal.jsx
CSS: -

`admin-tag`, `error`, `form-message`, `group-member`, `group-member-actions`, `group-rename`, `modal-list`, `modal-search`, `modal-subtitle`, `primary-btn`

### components/chat/MessageBubble.jsx
CSS: ChatPage.css

`chat-message`, `chat-message-row`, `danger`, `emoji-picker`, `message-action-wrap`, `message-actions`, `message-deleted-text`, `message-edited`, `message-media`, `message-menu`, `message-meta`, `message-reactions`, `message-reply`, `message-sender`, `message-text`, `message-time`, `reaction-chip`, `seen`, `seen-icon`, `seen-label`, `shared-caption`, `shared-card`, `shared-media`

### components/chat/NewChatModal.jsx
CSS: -

`empty-text`, `error`, `form-message`, `modal-actions`, `modal-list`, `modal-search`, `pick-check`, `pick-user`, `pick-user-text`, `primary-btn`, `selected-chip`, `selected-users`, `user-item-sub`

### context/AuthContext.jsx
CSS: -

``

### context/BadgeContext.jsx
CSS: -

``

### pages/ChatPage.jsx
CSS: ChatPage.css

`chat-box`, `chat-container`, `no-chat-selected`

### pages/ContentDetail.jsx
CSS: Feed.css

`back-btn`, `content-detail`, `feed`, `loading`, `no-posts`, `single-reel`

### pages/Explore.jsx
CSS: Explore.css

`empty-text`, `explore-page`, `explore-title`, `loading-text`, `trending-count`, `trending-tag`, `trending-tags`

### pages/Feed.jsx
CSS: Feed.css

`end`, `feed`, `feed-create`, `loading`, `no-posts`

### pages/FollowersList.jsx
CSS: FollowersList.css

`back-btn`, `empty-text`, `follower-card`, `followers-header`, `followers-list`, `followers-page`, `loading-text`, `remove-btn`

### pages/FollowingList.jsx
CSS: FollowingList.css

`back-btn`, `empty-text`, `following-card`, `following-header`, `following-list`, `following-page`, `loading-text`

### pages/Hashtag.jsx
CSS: Explore.css

`empty-text`, `explore-page`, `explore-title`, `loading-text`, `profile-tabs`

### pages/Notifications.jsx
CSS: Notifications.css

`empty-text`, `loading-text`, `notification-item`, `notification-main`, `notification-remove`, `notification-requests`, `notification-text`, `notification-thumb`, `notification-time`, `notifications-actions`, `notifications-header`, `notifications-list`, `notifications-page`, `primary-btn`, `secondary-btn`

### pages/Profile.jsx
CSS: profile.css

`blocked-note`, `chat-btn`, `clickable`, `cover-pic`, `cover-placeholder`, `cover-section`, `danger`, `edit-btn`, `empty-text`, `follow-info`, `icon-action`, `loading-text`, `page-loading`, `post-menu`, `private-notice`, `private-tag`, `profile-actions`, `profile-bio`, `profile-content`, `profile-menu-wrap`, `profile-meta`, `profile-name`, `profile-page`, `profile-pic`, `profile-pic-wrapper`, `profile-section`, `profile-tabs`, `profile-username`, `settings-btn`, `verified-icon`

### pages/SearchResults.jsx
CSS: Explore.css

`empty-text`, `explore-page`, `explore-title`, `loading-text`, `search-section`, `trending-count`, `trending-tag`, `trending-tags`

### pages/Settings.jsx
CSS: Settings.css

`empty-text`, `loading-text`, `logout-btn`, `secondary-btn`, `settings-page`, `settings-row`, `settings-section`

### pages/Suggestions.jsx
CSS: Suggestions.css

`no-suggestions`, `suggestion-card`, `suggestions-grid`, `suggestions-loading`, `suggestions-page`, `suggestions-search`

## Dynamic class names (built from state)

- Avatar sizes: `avatar-xs`, `avatar-sm`, `avatar-md`, `avatar-lg`, `avatar-xl` (always together with `avatar`)
- Follow button: `follow-btn` plus `follow-btn-none`, `follow-btn-following`, `follow-btn-requested`
- Story ring: `story-ring` plus `unseen`, `seen`, `empty`
- Story progress segment: `story-progress-segment` plus `done`, `active`, `upcoming`, `paused`, `image`, `video`. The active segment is re-mounted for each story, so a CSS animation on `.active` restarts per story (images run 5s).
- Chat container: `chat-container` plus `has-active` (use it to switch between list and window on mobile)
- Message rows: `chat-message-row` and `chat-message` plus `sent` or `received`, `deleted`
- Feedback messages: `form-message` plus `error` or `success`
- Navbar badge: `badge` inside `.icon-btn`
