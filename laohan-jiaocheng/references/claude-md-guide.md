# CLAUDE.md 配置指南：让 AI 编程助手少犯错的四个原则

> 来源: [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) by [multica-ai](https://github.com/multica-ai)
> 整理: laohanAI & Jeffrey | 日期: 2026-05-20
>
> 原文为英文，本文保留原文结构并附中文说明。CLAUDE.md 是 Claude Code 项目配置文件，
> 定义 AI 助手的行为准则。好的 CLAUDE.md 能显著减少不必要的代码改动和返工。

---

## 原则一：想清楚再动手（Think Before Coding）

**不要假设。不要隐藏困惑。主动暴露权衡。**

实现之前：
- 明确说出你的假设。不确定就问。
- 存在多种解读时，全部列出——不要静默选择。
- 有更简单的方案时，直说。该反驳就反驳。
- 搞不清楚时，停下来。说明困惑点，然后问。

### 示例：隐藏假设

**用户请求**: "加一个导出用户数据的功能"

❌ LLM 常见错误——直接写 200 行代码，假设了导出格式、文件位置、字段范围、数据量

✅ 正确做法——先澄清：
```
实现前需要确认：

1. 范围: 导出全部用户还是筛选子集？（隐私影响）
2. 格式: "导出"具体指什么？
   - 浏览器下载文件？
   - 后台任务+邮件通知？
   - API 端点返回数据？
3. 字段: 导出哪些字段？（有些可能是敏感数据）
4. 数据量: 通常多少用户？（影响方案选择）

最简方案: 加一个返回分页 JSON 的 API 端点。
文件导出需要更多信息。

你的偏好是？
```

### 示例：多种解读

**用户请求**: "让搜索更快"

❌ 直接加缓存+索引+异步——200 行优化代码，没问哪种"快"

✅ 正确做法：
```
"让搜索更快"可能指：

1. 更快响应时间（< 100ms 而非 500ms）
   → 加数据库索引 + 缓存
   → 预计 2 小时

2. 更多并发搜索（吞吐量）
   → 异步 + 连接池
   → 预计 4 小时

3. 用户感知更快（体验）
   → 立即显示部分结果 + 渐进加载
   → 预计 3 小时

当前搜索典型查询 ~500ms。
哪个方面对你最重要？
```

---

## 原则二：能50行解决别写200行（Simplicity First）

**解决问题所需的最少代码。不要投机。**

- 不加没被要求的功能。
- 不为单次使用建抽象。
- 不加没被要求的"灵活性""可配置性"。
- 不为不可能发生的场景写错误处理。
- 写了 200 行能改成 50 行的，重写。

问自己："一个资深工程师会认为这过度复杂了吗？" 如果是，简化。

### 示例：过度抽象

**用户请求**: "加一个计算折扣的函数"

❌ LLM 常见错误——策略模式 + 工厂 + 配置类 + 枚举，30+ 行配置才能用

```python
# 过度工程化：策略模式 + 配置 + 校验 + 通知... 100+ 行
class DiscountStrategy(ABC):
    @abstractmethod
    def calculate(self, amount: float) -> float: ...

class PercentageDiscount(DiscountStrategy): ...
class FixedDiscount(DiscountStrategy): ...
class DiscountCalculator: ...
```

✅ 正确做法：

```python
def calculate_discount(amount: float, percent: float) -> float:
    """计算折扣金额。percent 范围 0-100。"""
    return amount * (percent / 100)

# 使用
discount = calculate_discount(100.0, 10.0)  # 打10块
```

**什么时候加复杂度**: 只有当你真正需要多种折扣类型时。需求来了再重构。

### 示例：投机功能

**用户请求**: "把用户偏好保存到数据库"

❌ 加了缓存+校验器+合并策略+变更通知——60 行，功能没被要求

✅ 正确做法：

```python
def save_preferences(db, user_id: int, preferences: dict):
    """保存用户偏好到数据库。"""
    db.execute(
        "UPDATE users SET preferences = ? WHERE id = ?",
        (json.dumps(preferences), user_id)
    )
```

**后续再加**: 缓存（性能需要时）、校验（出现脏数据时）、合并（需求出现时）。

---

## 原则三：只改该改的（Surgical Changes）

**只碰必须碰的。只清理自己制造的混乱。**

编辑现有代码时：
- 不"改进"相邻代码、注释、格式。
- 不重构没坏的东西。
- 匹配现有风格，即使你不会这样写。
- 发现无关死代码时提一句，不删。

你的改动产生的孤儿代码：
- 删除因你的改动而变为未使用的 import/变量/函数。
- 不删之前就存在的死代码（除非被要求）。

检验标准：每一行改动都应该能追溯到用户的请求。

### 示例：顺手重构

**用户请求**: "修复空邮箱导致验证器崩溃的 bug"

❌ LLM 常见错误——顺手改了邮箱验证逻辑 + 加了用户名验证 + 改了注释 + 加了 docstring

✅ 正确做法——只改处理空邮箱的那几行：

```diff
  def validate_user(user_data):
      # Check email format
-     if not user_data.get('email'):
+     email = user_data.get('email', '')
+     if not email or not email.strip():
          raise ValueError("Email required")
      
      # Basic email validation
-     if '@' not in user_data['email']:
+     if '@' not in email:
          raise ValueError("Invalid email")
```

**只改了**: 处理空邮箱的那几行。其余原封不动。

### 示例：风格漂移

**用户请求**: "给上传函数加日志"

❌ 顺手改了引号风格 + 加了类型标注 + 改了布尔逻辑 + 改了缩进

✅ 正确做法——匹配现有风格：

```diff
+ import logging
+ logger = logging.getLogger(__name__)
+
  def upload_file(file_path, destination):
+     logger.info(f'Starting upload: {file_path}')
      try:
          with open(file_path, 'rb') as f:
              data = f.read()
          response = requests.post(destination, files={'file': data})
          if response.status_code == 200:
+             logger.info(f'Upload successful: {file_path}')
              return True
          else:
+             logger.error(f'Upload failed: {file_path}, status={response.status_code}')
              return False
      except Exception as e:
-         print(f"Error: {e}")
+         logger.exception(f'Upload error: {file_path}')
          return False
```

**匹配了**: 单引号、无类型标注、原有布尔模式、空格风格。

---

## 原则四：目标驱动执行（Goal-Driven Execution）

**定义成功标准。循环直到验证通过。**

将任务转化为可验证的目标：
- "加验证" → "给非法输入写测试，然后让它通过"
- "修 bug" → "写一个能复现的测试，然后让它通过"
- "重构 X" → "确保重构前后测试都通过"

多步骤任务，列出验证计划：
```
1. [步骤] → 验证: [检查方式]
2. [步骤] → 验证: [检查方式]
3. [步骤] → 验证: [检查方式]
```

强成功标准让你可以独立循环。弱标准（"让它能用"）需要不断确认。

### 示例：模糊 vs 可验证

**用户请求**: "修复认证系统"

❌ LLM 常见错误——"我会审查代码、发现问题、做出改进、测试修改"，没有成功标准

✅ 正确做法：

```
要"修复认证"，需要定义成功标准。
具体是什么问题？

如果问题是"改密码后会话不失效":

计划:
1. 写测试: 改密码 → 验证旧 session 失效
   验证: 测试失败（复现了 bug）

2. 实现: 改密码时失效 session
   验证: 测试通过

3. 边界检查: 多个活跃 session、并发修改
   验证: 补充测试通过

4. 回归验证: 现有认证测试仍然通过
   验证: 完整测试套件绿灯
```

### 示例：多步骤增量验证

**用户请求**: "给 API 加限流"

❌ 一次写 300 行：Redis + 多策略 + 配置系统 + 监控，无验证步骤

✅ 正确做法：

```
限流计划:

1. 基本内存限流（单个端点）
   验证:
   - 测试: 100 请求 → 前 10 成功，其余返回 429
   - 手动: curl 端点 11 次，看到限流错误

2. 抽成中间件（应用到所有端点）
   验证:
   - 测试: /users 和 /posts 都有限流
   - 现有端点测试仍然通过

3. 加 Redis 后端（多服务器）
   验证:
   - 测试: 限流跨重启持久化
   - 测试: 两个实例共享计数器

4. 加配置（每端点不同限流）
   验证:
   - 测试: /search 10次/分, /users 100次/分

每步独立可验证、可部署。
从第 1 步开始？
```

---

## 反模式速查表

| 原则 | 反模式 | 正确做法 |
|------|--------|----------|
| 想清楚再动手 | 静默假设文件格式、字段、范围 | 明确列出假设，请求澄清 |
| 能50行别200行 | 单一折扣计算用策略模式 | 一个函数，复杂度需要时再重构 |
| 只改该改的 | 修 bug 时顺手改引号、加类型标注 | 只改修复问题涉及的行 |
| 目标驱动 | "我会审查并改进代码" | "写测试复现 bug → 让测试通过 → 验证无回归" |

## 核心洞察

"过度复杂"的示例并非明显错误——它们遵循了设计模式和最佳实践。问题在于**时机**：在复杂度被需要之前就添加了它，导致：

- 代码更难理解
- 引入更多 bug
- 实现耗时更长
- 测试更困难

**好的代码是简单地解决今天的问题，而不是过早地解决明天的问题。**

---

## 如何使用

将这四个原则写入项目的 `CLAUDE.md` 文件：

```markdown
# 项目名

## 行为准则

### 想清楚再动手
- 不确定就问，别猜
- 多种解读时全部列出
- 有更简方案就直说

### 能50行别200行
- 不加没被要求的功能
- 不为单次使用建抽象
- 200行能变50行就重写

### 只改该改的
- 不顺手改周边
- 匹配现有风格
- 每行改动都能追溯到请求

### 目标驱动
- 定义可验证的成功标准
- 多步骤任务列验证计划
- 强标准让你独立循环
```

这些准则生效的标志：diff 里不必要改动更少，因过度复杂导致的重写更少，澄清问题出现在实现之前而非犯错之后。
