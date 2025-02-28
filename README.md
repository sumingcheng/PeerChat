# PeerChat
## 简介

小型P2P聊天应用：PeerJS + 公共STUN，下面是实现的逻辑

## 基本概念

基于ICE框架完成NAT穿透，利用信令服务器(PeerServer)交换SDP协商信息和ICE候选地址，建立端到端的安全通道；一旦连接建立，数据通过DTLS加密后使用SRTP/SCTP协议在对等端之间直接传输，完全绕过服务器，从而在浏览器间实现低延迟、高安全性的实时通信。在多人会话场景中，采用Mesh网络拓扑结构使各节点间形成完全图，每个节点都维护与其他所有节点的独立WebRTC连接。

## 图示
![1](https://github.com/user-attachments/assets/29aac949-138b-4e2f-ae4c-a099fae9b8b6)
