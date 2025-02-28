# PeerChat
点对点(P2P)通信和聊天功能

```
src/
├── components/
│   ├── layout/
│   │   └── ChatLayout.jsx             # 主布局组件
│   │
│   ├── sidebar/
│   │   ├── Sidebar.jsx                # 侧边栏容器（包含搜索栏）
│   │   └── ChatListItem.jsx           # 聊天列表项（包含头像、未读徽章）
│   │
│   ├── chat/
│   │   ├── ChatPanel.jsx              # 右侧聊天面板（包含头部）
│   │   ├── MessageList.jsx            # 消息列表
│   │   └── Message.jsx                # 消息组件（包含时间和状态）
│   │
│   ├── input/
│   │   └── ChatInput.jsx              # 聊天输入区域（包含所有输入控件）
│   │
│   └── common/
│       ├── Avatar.jsx                 # 通用头像组件
│       └── Badge.jsx                  # 通用徽章组件（可用于未读消息）
│
├── hooks/
│   └── useChat.js                     # 聊天相关逻辑
│
├── context/
│   └── ChatContext.jsx                # 聊天全局状态
│
└── pages/
    └── ChatPage.jsx                   # 整合所有组件的页面
```

