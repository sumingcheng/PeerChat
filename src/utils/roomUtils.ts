/**
 * 清理房间ID，移除不必要的字符和格式
 * @param id 原始房间ID或URL
 * @returns 清理后的房间ID
 */
export const cleanRoomId = (id: string): string => {
  // 如果输入为空，返回空字符串
  if (!id) return '';

  // 移除所有空格
  let cleanedId = id.trim();

  // 如果是URL，尝试提取roomId参数
  if (cleanedId.startsWith('http')) {
    try {
      const url = new URL(cleanedId);
      const roomIdParam = url.searchParams.get('roomId');
      if (roomIdParam) {
        console.log(`从URL中提取roomId: ${cleanedId} -> ${roomIdParam}`);
        cleanedId = roomIdParam.trim();
      } else {
        // 如果URL中没有roomId参数，尝试使用路径的最后一部分
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          const lastPathPart = pathParts[pathParts.length - 1];
          if (lastPathPart && lastPathPart.length > 5) {
            console.log(`从URL路径中提取可能的roomId: ${cleanedId} -> ${lastPathPart}`);
            cleanedId = lastPathPart.trim();
          }
        }
      }
    } catch (error) {
      console.error('解析URL失败:', error);
      // URL解析失败，继续使用原始输入
    }
  }

  // 移除可能导致连接问题的字符，如重复的 ID 部分 (hwW6wz-hwW6wz)
  if (cleanedId.includes('-')) {
    const parts = cleanedId.split('-');
    // 如果破折号两边的部分相同，只返回一部分
    if (parts[0] === parts[1]) {
      console.log(`检测到重复ID格式: ${cleanedId} -> ${parts[0]}`);
      cleanedId = parts[0];
    } else {
      // 如果是其他格式的破折号，可能是 PeerJS 内部使用的格式，尝试使用第一部分
      console.log(`检测到带破折号的ID: ${cleanedId} -> ${parts[0]}`);
      cleanedId = parts[0];
    }
  }

  // 移除任何非字母数字字符（保留破折号和下划线）
  cleanedId = cleanedId.replace(/[^\w\-]/g, '');

  // 确保ID长度合理（PeerJS ID通常为16个字符）
  // 如果ID太长，可能是错误的，截取前16个字符
  if (cleanedId.length > 20) {
    console.log(`ID过长，截取前16个字符: ${cleanedId} -> ${cleanedId.substring(0, 16)}`);
    cleanedId = cleanedId.substring(0, 16);
  }

  return cleanedId;
};
