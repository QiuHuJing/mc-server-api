const { RCON } = require('minecraft-rcon-client');
const cors = require('cors');

// 允许跨域（替换为你的 GitHub Pages 域名）
const corsMiddleware = cors({
  origin: 'https://QiuHuJing.github.io', // 例如 https://4u4n.github.io
  methods: ['GET']
});

module.exports = async (req, res) => {
  // 应用跨域配置
  await new Promise((resolve, reject) => {
    corsMiddleware(req, res, (result) => {
      if (result instanceof Error) reject(result);
      else resolve(result);
    });
  });

  const playerName = req.query.name;
  if (!playerName) {
    return res.status(400).json({ error: '请输入玩家名称' });
  }

  try {
    // 连接 Minecraft 服务器的 RCON（替换为你的服务器信息）
    const rcon = new RCON({
      host: '123.232.72.214', // 例如 123.45.67.89
      port: 25575, // RCON 端口（默认25575）
      password: 'kueidowr34r3u4u0345ja' // 后面会配置
    });

    await rcon.connect();

    // 1. 检查玩家是否在线
    const onlineRes = await rcon.send(`testfor ${playerName}`);
    if (!onlineRes.includes('Found')) {
      await rcon.disconnect();
      return res.json({ exists: false });
    }

    // 2. 获取背包信息（通过 EssentialsX 的 invsee 指令）
    const invRes = await rcon.send(`invsee ${playerName}`);
    const inventory = parseInventory(invRes);

    // 3. 获取 PAPI 变量（需服务器安装 PlaceholderAPI）
    const papiRes = await rcon.send(`papi parse ${playerName} 生命值:%player_health% 等级:%mcmmo_power_level%`);
    const papiVariables = parsePAPI(papiRes);

    await rcon.disconnect();

    // 返回结果给前端
    res.json({
      exists: true,
      name: playerName,
      inventory,
      papiVariables
    });

  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ error: '查询失败，请稍后重试' });
  }
};

// 解析背包数据（根据实际插件返回格式调整）
function parseInventory(raw) {
  // 示例：假设返回格式包含 "物品ID:数量"
  const items = [];
  // 这里仅为示例，实际需根据你服务器插件返回的格式修改
  const regex = /(\w+:\d+)\s*(\d+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    items.push({
      name: match[1], // 物品ID（如 minecraft:apple）
      amount: parseInt(match[2]),
      icon: `https://picsum.photos/32/32?random=${match[1]}` // 临时图标，后面可替换
    });
  }
  return items.length > 0 ? items : [];
}

// 解析 PAPI 变量
function parsePAPI(raw) {
  const vars = {};
  // 匹配 "键:值" 格式（如 "生命值:20"）
  const regex = /(\w+):([^ ]+)/g;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    vars[match[1]] = match[2];
  }
  return vars;
}