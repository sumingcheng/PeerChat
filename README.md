<div align="center">

# PeerChat

**Decentralized group chat in the browser via WebRTC — no server stores your messages.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Demo-GitHub_Pages-brightgreen)](https://sumingcheng.github.io/PeerChat/)

[English](#english) · [中文](#中文)

</div>

---

<a name="english"></a>

## What is PeerChat?

PeerChat is a fully client-side group chat application. Messages travel directly between browsers over WebRTC data channels — the only server involved is a lightweight PeerJS signaling server used to establish connections. Once connected, all communication is peer-to-peer.

## Features

- **Zero message storage** — No backend database, no chat logs on any server. When you close the tab, the conversation exists only in the memory of the participants.
- **Group chat with star topology** — The room creator acts as the host; every member connects to the host, who relays messages to the rest of the group.
- **Host / member roles** — The host is visually distinguished in the UI and responsible for broadcasting room state to new joiners.
- **One-click room sharing** — Generate a shareable link or room ID for others to join instantly.
- **Real-time presence** — See who is online in the current room.
- **NAT traversal** — Built-in STUN/TURN configuration for connectivity across different network environments.

## Architecture

![1](https://github.com/user-attachments/assets/29aac949-138b-4e2f-ae4c-a099fae9b8b6)

**Service layer design:**

| Layer | Responsibility |
|---|---|
| `ConnectionManager` | Manages all `DataConnection` instances; provides `send` / `broadcast` primitives |
| `PeerService` | PeerJS lifecycle, message dispatch, heartbeat |
| `GroupChatService` | Create / join / leave room logic |
| `MessageService` | Send messages (host broadcasts, members send to host) |
| `useChatStore` | Zustand global state + service singleton factory |

## Tech Stack

| Category | Technologies |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS, Radix UI |
| State | Zustand |
| Networking | PeerJS (WebRTC DataChannel) |
| Build | Vite, pnpm |
| Deployment | GitHub Pages |

## Getting Started

**Prerequisites:** Node.js >= 18, pnpm >= 9

```bash
# Clone
git clone https://github.com/sumingcheng/PeerChat.git
cd PeerChat

# Install
pnpm install

# Dev server (default http://localhost:5173)
pnpm run dev

# Production build
pnpm run build

# Deploy to GitHub Pages
pnpm run deploy
```

## License

[Apache License 2.0](LICENSE)

---

<a name="中文"></a>

## 中文说明

### PeerChat 是什么？

PeerChat 是一个纯前端的去中心化群聊应用。消息通过 WebRTC 数据通道在浏览器之间直接传输，唯一涉及的服务器是用于建立连接的 PeerJS 信令服务器。连接建立后，所有通信都是点对点的。

### 核心特性

- **零消息存储** — 没有后端数据库，没有服务器聊天记录。关闭标签页后，对话仅存在于参与者的内存中。
- **星型拓扑群聊** — 房间创建者作为主持人，所有成员连接主持人，由主持人负责中继转发消息。
- **主持人 / 成员角色** — 主持人在 UI 上有明显标识，并负责向新加入者广播房间状态。
- **一键分享房间** — 生成分享链接或房间 ID，其他人可即时加入。
- **实时在线状态** — 查看当前房间中的在线成员。
- **NAT 穿透** — 内置 STUN/TURN 配置，适配各种网络环境。

### 架构

| 层级 | 职责 |
|---|---|
| `ConnectionManager` | 管理所有 `DataConnection` 实例，提供 `send` / `broadcast` 原语 |
| `PeerService` | PeerJS 生命周期管理、消息分发、心跳 |
| `GroupChatService` | 建群 / 加群 / 离群逻辑 |
| `MessageService` | 消息发送（主持人广播，成员发送给主持人） |
| `useChatStore` | Zustand 全局状态 + 服务单例工厂 |

### 技术栈

| 类别 | 技术 |
|---|---|
| UI | React 18、TypeScript、Tailwind CSS、Radix UI |
| 状态管理 | Zustand |
| 网络 | PeerJS（WebRTC DataChannel） |
| 构建 | Vite、pnpm |
| 部署 | GitHub Pages |

### 快速开始

**前置要求：** Node.js >= 18，pnpm >= 9

```bash
# 克隆
git clone https://github.com/sumingcheng/PeerChat.git
cd PeerChat

# 安装依赖
pnpm install

# 开发服务器（默认 http://localhost:5173）
pnpm run dev

# 生产构建
pnpm run build

# 部署到 GitHub Pages
pnpm run deploy
```

### 许可证

[Apache License 2.0](LICENSE)
