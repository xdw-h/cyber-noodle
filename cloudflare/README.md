# 小镇正式挑战榜

独立 Cloudflare Worker + D1。复用上层游戏引擎，在服务端从种子和已验证检查点重放操作；客户端不上传现金、资产或成绩。部署必须使用现有免费计划，不启用付费订阅。

## 部署

1. 在本目录运行 `wrangler d1 create cyber-noodle-rank`，把返回 ID 写入 `wrangler.jsonc` 的 `database_id`。
2. 运行 `wrangler d1 migrations apply cyber-noodle-rank --remote`。
3. 运行 `wrangler deploy`，记录 HTTPS 地址并填入前端排行榜配置。
4. 验证 `/v1/status`、两个公开排行榜和真实挑战开局/日结。Wrangler 登录凭证保留在本机工具配置中，不放入此目录。

`ALLOWED_ORIGINS` 是逗号分隔的完整 Origin，生产默认仅 `https://xdw-h.github.io`。本地测试请通过开发环境显式加入具体 `http://localhost:端口`；不要使用 `*`。无 Origin 的调用仍必须通过 Bearer 身份验证才能写入。后续天允许先在 tick0 领取前一天日结奖励，再调用一次 `nextDay`、备货和 `openDay`。

## 客户端约定

- `POST /v1/session`，JSON `{name}`：2–12 Unicode 字符，返回匿名 `token`、`playerId`、`name`、`expiresAt`、`ruleVersion`。之后写请求和局读取携带 `Authorization: Bearer <token>`。
- `POST /v1/profile`，JSON `{name}`：使用原 Bearer 身份改名，不创建玩家或删除历史局，每天最多 10 次；公开榜昵称缓存最多延迟 30 秒更新。
- `POST /v1/runs`：新建同版本统一种子局，返回 `{runId,seq:0,state,tickSeconds:0.1,ruleVersion,...成绩字段}`。每账号每天最多 5 局，每 IP 每天最多 10 个匿名账号。
- `GET /v1/runs/:id`：仅本人可读取服务端检查点。未完成的一天必须从检查点重新开始；本地导入档不得替代它。
- `POST /v1/runs/:id/days`：`{seq:下一序号,requestId:8至80位字母数字下划线或短横线,events:[{at:整数tick,action,args:参数数组}],ticks:总tick}`。每 tick 严格 `.1` 秒，动作在 tick 之前执行，最后一刻动作 `at=ticks`。首天准备和开门位于 tick0，后续天在 tick0 调用 `nextDay`，允许此前领取上日奖励。每次最多 256 动作和 2400 tick。必须完成自然 90 秒营业和收摊；提前关门不进入正式榜。营业前无法继续经营时可提交 ticks0 的真实破产清算。每次返回权威 state，客户端应采用它。
- `GET /v1/rankings?board=wealth|survival`：公开前 50 名，同一玩家仅取本榜最好一局。包含 `rank,name,runId,wealth,survivalDays,highestCash,totalRevenue,terminal`；30 秒缓存。`wealth` 为最高日结可回收净资产，`survivalDays` 为完整自然营业日数。姓名用文本节点渲染。`GET /v1/status` 返回版本和允许动作。

支持动作：引擎 `setPrice,purchase,setAIMode,setRobotMode,repairRobot,upgradeRobot,upgradeDrone,requestSupply,dispatchDrone,dispatchGround,openDay,closeDay,enqueue,nextDay,buyRobot`；`setAuto(boolean)`；`Growth.claim/research/decorate/special`；`District.accept/clear/claim`；`Branch.establish/purchase/setEnabled`；`Dining.seatParty/requestClean/setPolicy/toggle/upgradeServer`；`Town.activity/reserve/sellAssets/liquidate`。参数与引擎一致，去掉第一个 state 参数。清算会由服务端先检查偿付能力，并忽略客户端提供的原因。

同 requestId 同内容重试返回原结果，不重复结算；同 ID 不同内容返回409。并发更新使用 D1 原子 batch 和序号比较交换，落后提交返回409。429 表示速率/时间约束，应保留原请求再试；401 需重新获取身份。成绩只来自服务端重放；这能防伪造分数，不能防机器人按规则自动玩、多人共享凭证或更换 IP。

服务端只保存 token 的 SHA-256，令牌本身由浏览器保存，30 天到期。匿名凭证丢失不保证找回。历史成绩保留；配额和幂等回执可通过导出的 scheduled 处理器清理（默认未配置定时任务）。单局上限365天，后续规则调整应变更规则版本，并同步引擎、客户端和 Worker。
