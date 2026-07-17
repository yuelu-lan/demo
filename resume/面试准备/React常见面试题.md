# React 常见面试题

> 范围:React 常见面试题的练习与积累(非真实面试题),难度不低于真实面试题。
> 体例:每题含【分析过程】(详细推导)+【参考答案】(精简,符合面试场景)。
> 区别于《面试题练习》(真实面试题)、《模拟面试记录》(简历下钻)、《面试知识速记卡》(背诵卡)。

---

## 第 1 题 · React 闭包陷阱(stale closure)成因与解法

### 分析过程

这是函数组件最经典的坑,考察"你真的理解 Hooks 闭包了吗"。速记卡里只记了一句,这里展开成独立题。

**1. 先讲清闭包陷阱的根因**

函数组件每次 render 都是一次"全新的函数调用",这次调用里所有局部变量(包括 state、props)都是这次 render 的快照。`useEffect` / `useCallback` 如果捕获了这些变量却没把它们放进依赖数组,就会一直持有"首次或某次 render 的旧快照",这就是 stale closure。

关键认知:**React 里 state 不是"一个会变的变量",而是"每次 render 的一组新值"**。`setCount(count + 1)` 里的 `count` 是当前 render 的快照,不是"最新值"。

**2. 经典场景:定时器读到永远是 0**

```js
function Counter() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(count + 1);   // count 永远是首次 render 的 0
    }, 1000);
    return () => clearInterval(timer);
  }, []);                    // 空依赖 → 闭包捕获首次 count
  return <div>{count}</div>;
}
```

结果:页面永远停在 1。因为 `setInterval` 回调持有的 `count` 是首次 render 的 0,`0 + 1 = 1`,下次 setState 又是 `0 + 1 = 1`。

**3. 三种解法及其原理**

- **解法 A:依赖数组补全 + 清理重建**
  把 `count` 放进 deps。但这样每次 count 变都会清掉旧定时器、建新定时器,定时器逻辑被"重建"——对 setInterval 场景不优雅,且如果定时器里有副作用会出问题。对 `useEffect` 里"读最新值做一次性副作用"的场景这是正解。

- **解法 B:函数式更新**
  `setCount(c => c + 1)`。React 保证 `c` 是"基于上一个最新值"的,绕过闭包捕获。适用于"新值依赖旧值"的 setState 场景。**但这只解决 state 更新,不能解决"要在回调里读最新值做别的事"的场景**。

- **解法 C:useRef 持有可变值**
  ```js
  const countRef = useRef(count);
  useEffect(() => { countRef.current = count; });   // 每次 render 同步
  useEffect(() => {
    const timer = setInterval(() => {
      setCount(countRef.current + 1);   // 总是读最新
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  ```
  ref 的 `.current` 是个可变容器,useEffect 空依赖捕获的是 ref 对象(引用稳定),但读 `.current` 时拿的是最新值。**定时器、订阅、事件监听这种"只建一次但要用最新值"的场景,ref 是标准解法。**

**4. 为什么 class 组件没这问题**

类组件的 `this.state` 是实例上的可变属性,定时器回调里 `this.state.count` 读的是当前值。函数组件没有"实例",每次 render 是新函数新闭包,所以才需要 ref/函数式更新来"逃逸"闭包。这是 Hooks 的固有代价。

**5. 面试加分点**

能说出:"闭包陷阱不是 bug,是函数组件'每次 render 都是新快照'这个设计的必然副作用。解法选择看场景:state 依赖旧值用函数式更新;定时器/订阅类用 useRef;一次性副作用用依赖补全。"

### 参考答案

**成因:** 函数组件每次 render 是一次新调用,所有变量是这次 render 的快照。`useEffect`/`useCallback` 若捕获变量却没进依赖数组,就持有旧快照,读到 stale 值。

**经典场景:** `useEffect` 空依赖里 `setInterval(() => setCount(count + 1))`,`count` 永远是首次的 0,页面停在 1。

**三种解法:**
1. **依赖补全**:把变量放进 deps,副作用随变量变化重建。适合一次性副作用。
2. **函数式更新**:`setCount(c => c + 1)`,React 保证 `c` 是最新值。适合"新值依赖旧值"的 setState。
3. **useRef**:用 ref 持有可变值,空依赖的 effect 捕获 ref(引用稳定),读 `.current` 拿最新。适合定时器/订阅这类"建一次用最新值"的场景。

**本质:** 闭包陷阱是函数组件"每次 render 新快照"设计的必然副作用,不是 bug。class 组件靠 `this.state` 可变属性天然规避,函数组件靠 ref/函数式更新逃逸闭包。

---

## 第 2 题 · useEffect 与 useLayoutEffect 的区别

### 分析过程

这题考察对 React 副作用时机和浏览器渲染时序的理解,容易答成"一个异步一个同步"就停了,实际上要讲清渲染管线。

**1. 先讲浏览器渲染管线**

一帧里浏览器做:JS 执行 → 样式计算 → 布局(layout) → 绘制(paint) → 合成。React 的 commit 阶段在 JS 执行末尾,DOM 变更发生在 commit。`useEffect` 和 `useLayoutEffect` 都是 commit 阶段后触发,但时机不同。

**2. 两者的精确时机**

- **useLayoutEffect**:在 DOM 变更后、浏览器绘制前**同步**触发。会阻塞绘制,浏览器会等它跑完才 paint。
- **useEffect**:在 DOM 变更且浏览器绘制后**异步**触发,不阻塞绘制,React 把它放到下一帧的宏任务/微任务里(实际是通过 `MessageChannel` 调度)。

**3. 从时机倒推使用场景**

useLayoutEffect 适合"需要读取 DOM 布局并同步改 DOM,避免视觉闪烁"的场景:
- 测量元素尺寸后立刻定位 tooltip / popper
- 滚动到某位置(避免闪烁)
- 动画初始状态同步设置

典型例子:一个 tooltip 要根据按钮位置定位,如果用 useEffect,先 paint 一帧错误位置再修正,用户看到"跳一下";用 useLayoutEffect,在 paint 前算好位置,paint 时直接对。

useEffect 适合绝大多数副作用:订阅、fetch、日志、定时器,这些不依赖 DOM 布局、不需要阻塞绘制。

**4. 性能代价**

useLayoutEffect 同步阻塞绘制,在里面做耗时操作会卡帧。所以默认用 useEffect,只在"读取布局并同步写 DOM 防闪烁"时才用 layout。

**5. SSR 陷阱**

服务端渲染时 `useLayoutEffect` 会报警告(`useLayoutEffect does nothing on the server`),因为它依赖 DOM 但服务端没有。常用做法是写一个 `useIsomorphicLayoutEffect`:`typeof window !== 'undefined' ? useLayoutEffect : useEffect`。

**6. 一个常见误区**

"useLayoutEffect 总比 useEffect 好"是错的。绝大多数场景 useEffect 就够了,无脑用 layout 会让绘制被阻塞、掉帧。判断标准:**这次副作用是否需要读 DOM 布局并同步写回去防闪烁?是→layout;否→effect。**

### 参考答案

**时机区别:**
- **useLayoutEffect**:DOM 变更后、浏览器绘制前**同步**触发,阻塞绘制。
- **useEffect**:DOM 变更并绘制后**异步**触发,不阻塞绘制。

**使用场景:**
- **useLayoutEffect**:需要读取 DOM 布局并同步改 DOM 防视觉闪烁——如测量元素尺寸定位 tooltip、滚动定位、动画初始状态。先算好再 paint,避免"跳一下"。
- **useEffect**:绝大多数副作用——订阅、fetch、日志、定时器,不依赖 DOM 布局。

**性能:** useLayoutEffect 阻塞绘制,耗时操作会掉帧。默认用 useEffect,只在防闪烁场景用 layout。

**SSR:** useLayoutEffect 在服务端报警告,常用 `useIsomorphicLayoutEffect`(`typeof window !== 'undefined' ? useLayoutEffect : useEffect`)规避。

**判断标准:** 要读 DOM 布局并同步写回防闪烁 → layout;否则 → effect。

---

## 第 3 题 · useMemo / useCallback 的使用误区

### 分析过程

这题考察"你是不是无脑加 memo",反模式很常见。面试官想看你对"何时该用、何时反成负担"有判断。

**1. 先讲清这两个 API 干嘛的**

- `useMemo`:缓存一个值的计算结果,deps 不变就返回缓存值。
- `useCallback`:缓存一个函数引用,deps 不变就返回同一引用(本质是 `useMemo(() => fn, deps)`)。

两者目的都是**保持引用稳定**,次要目的是**跳过昂贵计算**。

**2. 关键认知:它们本身有成本**

每次 render,React 都要:对比 deps 数组(浅比较)、维护缓存、跑你的 memo 工厂函数。对一个简单值或小函数,这个"维护缓存的成本"可能比直接重新算还高。所以不是越多越好。

**3. 什么时候该用**

- **useMemo 跳过昂贵计算**:计算确实贵(如大列表 filter/sort、复杂数学、深拷贝),且 deps 不常变。判断标准:计算耗时 + 频繁 render + deps 稳定,三者同时成立才划算。
- **useCallback / useMemo 保持引用稳定,传给被 memo 的子组件**:这是更常见的正当理由。父组件 render 时如果传给子组件的函数/对象是新建的,即便子组件用 `React.memo` 包了,引用变了还是触发子组件 re-render。此时用 useCallback/useMemo 保持引用,让 memo 真正生效。

**4. 关键陷阱:不配 React.memo 的 useCallback 是无效优化**

```js
// 父组件
const handleClick = useCallback(() => {...}, []);
return <Child onClick={handleClick} />;
```
如果 `Child` 没用 `React.memo` 包,父组件每次 render Child 都会 re-render,useCallback 白写。useCallback 的价值必须配合 `React.memo`(或 `shouldComponentUpdate`)才能兑现——它保证引用稳定,memo 保证引用没变就跳过。两者是配套的。

**5. 另一个陷阱:deps 写错反而更糟**

```js
useMemo(() => expensive(data), [data, filter]);  // 漏了 sort
```
deps 没列全,缓存命中时返回的是用旧 sort 算的结果,bug 难查。这是 useMemo 特有的坑(useEffect 也有)。

**6. 什么时候不该用**

- 计算很便宜(简单运算、小数组 map),直接算,别 memo。
- 传给原生 DOM 元素或没 memo 的组件的 props,不需要 useCallback。
- deps 每次都变,memo 永远不命中,纯浪费。
- 为了"可能有用"提前加,是过度优化。

**7. 升华一句话**

> "useMemo/useCallback 不是性能开关,是'保持引用稳定以配合 memo'的工具。判断标准:这个值/函数的引用稳定性能让下游 memo 生效吗?或者这个计算真的昂贵吗?都不是就别加。"

### 参考答案

**两者目的:**
- `useMemo`:缓存计算结果,跳过昂贵计算 + 保持值引用稳定。
- `useCallback`:缓存函数引用(本质是 useMemo 的语法糖)。

**该用的场景:**
1. **跳过昂贵计算**:计算确实耗时(大列表 filter/sort、深拷贝)+ 频繁 render + deps 稳定,三者同时成立。
2. **保持引用稳定传给 memo 子组件**:父组件传给 `React.memo` 包裹的子组件的函数/对象,用 useCallback/useMemo 保持引用,让 memo 生效。

**关键误区:**
- **不配 React.memo 的 useCallback 无效**:子组件没 memo,父组件每次 render 子组件都 re-render,useCallback 白写。useCallback 必须配合 React.memo 才有价值。
- **deps 写错**:漏列 deps 会命中过期缓存,返回旧结果,bug 难查。
- **无脑加不是优化**:memo 本身有对比 deps + 维护缓存的成本,简单计算直接算更快。

**不该用:** 计算便宜、传给原生 DOM/未 memo 组件、deps 每次都变、提前"防患"。

**判断标准:** 这个引用稳定性能让下游 memo 生效吗?或者计算真的昂贵吗?都不是就别加。

---

## 第 4 题 · React.memo 的浅比较与引用相等陷阱

### 分析过程

承接第 3 题,这里专门讲 `React.memo`。考察"浅比较到底比什么、为什么会失效、怎么自定义"。

**1. React.memo 是什么**

`React.memo(Component, areEqual?)` 是高阶组件,对函数组件做类似 class 的 `shouldComponentUpdate`:父组件 re-render 时,如果 props 浅比较没变,就跳过这个组件的 re-render。

默认比较函数:对 props 对象的每个 key 做 `Object.is` 比较,全相等才跳过。

**2. 引用相等陷阱:为什么浅比较经常失效**

浅比较只比"这一层引用",所以只要 props 是父组件 render 时新建的对象/数组/函数,引用就变了,memo 失效:

```js
const Parent = () => {
  const [n, setN] = useState(0);
  const style = { color: 'red' };            // 每次 render 新对象
  const onClick = () => {...};                // 每次 render 新函数
  const list = [1, 2, 3];                     // 每次 render 新数组
  return <MemoChild style={style} onClick={onClick} list={list} />;
};
```
即便 `n` 和 Child 无关,Parent 每次 render 都让 MemoChild 的 props 全部引用变化,memo 完全失效。

**这正是第 3 题说的:useMemo/useCallback 要配合 memo 才能兑现价值。** 把 style/list 用 useMemo、onClick 用 useCallback 包住,引用稳定了,memo 才能命中。

**3. 浅比较的"浅"字坑**

```js
const user = { name: 'a', score: { math: 90 } };
// 父组件 user 引用没变,但 user.score.math 改了
```
浅比较看 `user` 引用没变就跳过,但内部数据其实变了——如果子组件依赖 `user.score.math`,会显示旧值。这是"浅"的固有限制。解法:要么保持数据不可变(改数据时返回新顶层对象),要么自定义比较函数。

**4. 自定义比较函数 areEqual**

```js
const MemoChild = React.memo(Child, (prev, next) => {
  return prev.user.id === next.user.id;   // 返回 true 表示相等(跳过 render)
});
```
注意返回值语义和 `shouldComponentUpdate` **相反**:`true` = props 相等 = 跳过 render。面试常考这个反直觉点。

**5. 什么时候用 memo**

- 组件渲染成本高(大列表项、复杂图表),且经常因父组件无关 state 变化被牵连 re-render。
- props 简单且能保持引用稳定(配合 useMemo/useCallback)。

**6. 什么时候别用**

- 组件本身渲染很轻,memo 的比较成本反超收益。
- props 必然每次新建(没配合 useMemo/useCallback),memo 永远失效,纯浪费。
- 子组件 props 里有深层变化需要精确比较,memo 的浅比较会漏——要么改数据不可变,要么自定义比较。

**7. 与 React.PureComponent 的关系**

`React.PureComponent` 是 class 组件版的 memo,内置浅比较 `shouldComponentUpdate`。函数组件用 `React.memo`,class 用 `PureComponent`,机制同源。

### 参考答案

**是什么:** `React.memo(Cmp, areEqual?)` 对函数组件做 props 浅比较,没变就跳过 re-render。默认对每个 prop 做 `Object.is`。

**引用相等陷阱:** 浅比较只比一层引用。父组件 render 时新建的对象/数组/函数(style、onClick、list)引用必变,memo 失效。必须配合 `useMemo`/`useCallback` 保持引用稳定,memo 才能命中。

**浅比较的"浅"坑:** props 引用没变但内部嵌套数据变了,浅比较判等会漏。解法:数据不可变(改时返回新顶层对象)或自定义比较函数。

**自定义比较:** `React.memo(Cmp, (prev, next) => true表示相等跳过)`。注意返回值语义与 `shouldComponentUpdate` 相反——`true` = 跳过 render。

**该用:** 组件渲染成本高 + 经常因父组件无关 state 被牵连 re-render + props 能保持引用稳定。
**别用:** 组件渲染轻(比较成本反超)、props 必然每次新建(memo 永远失效)、需要深层比较(浅比较会漏)。

**与 PureComponent:** PureComponent 是 class 版的 memo,内置浅比较 shouldComponentUpdate,机制同源。

---

## 第 5 题 · Context 性能陷阱与解法

### 分析过程

这题考察对 Context 更新机制的深度理解,是中高级常见题。"Context 值变化会触发所有消费者 re-render"这个陷阱,解法有多种,要能对比。

**1. 先讲 Context 的更新机制**

`createContext` 创建一个 context,Provider 的 `value` 变化时,所有消费这个 context 的组件(useContext / contextType / Consumer)都会 re-render,而且**这个 re-render 不受 React.memo 约束**——因为 Context 更新是"跳过中间组件直接通知消费者",memo 拦不住。

**2. 陷阱:value 引用每次都变**

```js
const App = () => {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('light');
  return (
    <AppContext.Provider value={{ user, theme }}>   {/* 每次 render 新对象 */}
      <ExpensiveTree />
    </AppContext.Provider>
  );
};
```
Provider 的 value 是个内联对象,App 每次 render(比如 theme 变)都会生成新 value 引用,所有消费者都 re-render,即便它们只关心 user。这是最常见的性能问题来源。

**3. 解法一:value 用 useMemo 稳定引用**

```js
const value = useMemo(() => ({ user, theme }), [user, theme]);
<AppContext.Provider value={value}>
```
value 引用稳定,只有 user 或 theme 真变才换引用。但这是**整体替换**——任一变化还是让所有消费者 re-render,没解决"只关心 user 的组件被 theme 变化牵连"。

**4. 解法二:拆分 Context**

把 user 和 theme 拆成两个独立 Context:
```js
<UserContext.Provider value={user}><ThemeContext.Provider value={theme}>...
```
这样 theme 变只让 ThemeContext 消费者 re-render,UserContext 消费者不动。这是最朴素有效的解法:按"变化频率/消费群体"拆分。

**5. 解法三:拆分 state 与派发**

对于"频繁 dispatch 但 state 很少变"的场景(如全局状态管理),把 state 和 dispatch 拆成两个 Context:
```js
<StateContext.Provider value={state}>
  <DispatchContext.Provider value={dispatch}>
```
dispatch 引用永远稳定(useReducer 的 dispatch 天然稳定),所以 dispatch 消费者从不会因 dispatch 变化 re-render,只有真正读 state 的消费者在 state 变时 re-render。这是 `use-context-selector` 等库的核心思路简化版。

**6. 解法四:外部 store(useSyncExternalStore)**

对于高频更新或只关心 context 某个字段的场景,Context 本身的"全量通知"是结构性缺陷。React 18 的 `useSyncExternalStore` 允许订阅外部 store(zustand、jotai、redux 都基于它),可以做**字段级订阅**——组件只订阅自己关心的字段,其他字段变化不触发 re-render。这是现代状态库解决 Context 性能问题的标准方案。

**7. 选型建议**

- value 引用不稳 → 先用 useMemo 包 value(最低成本)。
- 消费群体按变化频率分群 → 拆分 Context。
- 频繁 dispatch → 拆分 state/dispatch Context。
- 高频更新或字段级订阅 → 用基于 useSyncExternalStore 的外部 store(zustand/jotai)。

**8. 一个易混点**

"Context 变化跳过 memo"——有人误以为给消费者套 memo 就能避免。错。Context 更新是 React 内部直接调度消费者,不走 props 比较,memo 无效。这是 Context 和 props 更新的本质区别。

### 参考答案

**机制:** Provider 的 value 变化时,所有消费者 re-render,且**不受 React.memo 约束**(Context 更新跳过中间组件直接通知消费者,不走 props 比较)。

**陷阱:** value 内联对象每次 render 引用必变,触发全量消费者 re-render。

**解法:**
1. **useMemo 包 value**:稳定 value 引用,但任一字段变仍全量 re-render。
2. **拆分 Context**:按变化频率/消费群体拆成多个 Context,各自独立更新。
3. **拆分 state / dispatch**:dispatch 引用稳定(useReducer 天然稳定),dispatch 消费者不因 dispatch 变化 re-render。
4. **外部 store(useSyncExternalStore)**:字段级订阅,只关心的字段变才 re-render。zustand/jotai/redux 均基于此。

**选型:** value 引用不稳先用 useMemo;消费群体分群拆 Context;高频 dispatch 拆 state/dispatch;高频更新或字段级订阅上外部 store。

**易混点:** 给消费者套 memo 拦不住 Context 更新——Context 是直接调度消费者,不走 props 比较,memo 无效。

---

## 第 6 题 · useTransition 与 useDeferredValue 的区别与场景

### 分析过程

这是 React 18 并发渲染的两个实战 API,容易混淆。考察"两者都是把某部分渲染降优先级,但用法和语义不同"。

**1. 先讲并发渲染基础**

React 18 的 Concurrent 渲染让渲染可中断,高优先级更新(用户输入)可打断低优先级更新(大列表)。`useTransition` 和 `useDeferredValue` 都是"把某些更新标记为低优先级"的工具,避免大计算阻塞交互。

**2. useTransition:从"动作"侧降级**

```js
const [isPending, startTransition] = useTransition();
const onSearch = (v) => {
  setKeyword(v);              // 高优先级:输入框立即更新
  startTransition(() => {
    setResults(filter(v));    // 低优先级:大列表结果延后更新
  });
};
```
- 包裹的是**触发更新的代码**(setState 调用)。
- 返回 `isPending` 标志,可据此显示 loading 态。
- 适合"我主动知道这次更新可以慢"的场景——比如点击 tab 切换大列表、搜索结果重算。

**3. useDeferredValue:从"值"侧降级**

```js
const [keyword, setKeyword] = useState('');
const deferredKeyword = useDeferredValue(keyword);
const results = useMemo(() => filter(deferredKeyword), [deferredKeyword]);
// input 用 keyword(立即响应),列表用 deferredKeyword(可延后)
```
- 传入一个**值**,返回它的"延迟版本"。
- 不需要你控制 setState,适合"值来自别处(受控 input、props)、我没法包裹 setState"的场景。
- 没有 isPending,要自己用 memo + 比较新旧值判断。

**4. 核心区别**

| | useTransition | useDeferredValue |
|---|---|---|
| 作用点 | 动作侧(包裹 setState) | 值侧(延迟一个值) |
| 谁主动 | 你能控制触发更新的代码 | 值来自外部,你控制不了 setState |
| isPending | 有 | 没有 |
| 典型场景 | tab 切换、按钮触发的重计算 | 受控输入框的实时过滤 |

**5. 一个判断技巧**

- 如果"触发更新的代码是你写的" → useTransition(更主动,有 isPending)。
- 如果"值是从 props 或受控 input 来的,你只能拿到值" → useDeferredValue。

**6. 为什么能不阻塞交互**

两者都让对应的更新进入低优先级队列,React 在渲染过程中如果来了高优先级更新(用户输入),会打断低优先级渲染先处理高优先级,再回来继续。这就是 Concurrent 的可中断能力落地到 API。

**7. 边界**

- 两者都依赖 Concurrent 渲染(React 18 createRoot),旧版 render 无效。
- 降优先级不是"免费",大计算本身还是要跑,只是被拆成可中断的片,不卡主线程交互。
- 不要无脑用,简单场景普通 setState 就够了,只有"更新成本高 + 需要保持交互响应"时才值得。

### 参考答案

**两者本质:** 都是 React 18 并发渲染 API,把某些更新标记为低优先级,避免大计算阻塞用户交互。

**useTransition(动作侧):**
- 包裹触发更新的 setState 调用,把它们降为低优先级。
- 返回 `isPending`,可显示 loading 态。
- 适合你主动控制触发代码的场景:tab 切换、按钮触发的重计算。

**useDeferredValue(值侧):**
- 传入一个值,返回它的延迟版本,下游用延迟值计算。
- 不需要控制 setState,适合值来自外部(受控 input、props)的场景:实时搜索过滤。
- 没有 isPending,需自己用 memo + 新旧值比较判断。

**判断技巧:** 触发代码是你写的 → useTransition;值来自外部你拿不到 setState → useDeferredValue。

**前提:** 依赖 React 18 createRoot 的并发渲染,旧 render 无效。简单场景不必用,只有"更新成本高 + 需保持交互响应"才值得。

---

## 第 7 题 · React 渲染的两个阶段:Render 与 Commit

### 分析过程

这是理解 React 性能和副作用时机的基础题,也是上面几题(useEffect/useLayoutEffect/memo)的底层支撑。考察"reconcile 可中断、commit 不可中断、副作用发生在哪"。

**1. React 一次更新的两个阶段**

React 把一次更新分成两个阶段:

- **Render 阶段(reconcile 协调)**:React 拿到新的 state/props,调用组件函数计算虚拟 DOM,和上一次的 Fiber 树做 Diff,找出要做的变更。这个阶段**纯计算、可中断、可重试**。React 18 并发模式下,这个阶段可以被高优先级更新打断,分片进行。
- **Commit 阶段(提交)**:把 Render 阶段算出的变更**同步**应用到真实 DOM(增删改节点、ref 更新等)。这个阶段**不可中断**,一气呵成,避免用户看到中间态。

**2. 为什么这样分**

- Render 阶段是"算账",纯函数计算,中断/重试不影响正确性,所以可以拆片、可被打断——这就是 Concurrent 的基础。
- Commit 阶段是"动 DOM",一旦开始改 DOM 必须做完,否则用户看到半成品(比如节点删了一半),所以必须同步不可中断。

**3. 副作用的时机**

- **Render 阶段不允许有副作用**:不能在组件函数体里直接改 DOM、发请求、写全局变量。因为 Render 可能被中断重试,副作用跑多次会出 bug。`useState` 的初始化函数、`useMemo` 的计算也都应该在 Render 阶段保持纯。
- **副作用发生在 Commit 阶段及之后**:
  - `useLayoutEffect`:Commit 阶段 DOM 变更后**同步**执行(绘制前)。
  - `useEffect`:Commit 阶段后**异步**执行(绘制后)。
  - 这正是第 2 题讲的两者时机差异的根因。

**4. 和前面几题的串联**

- **useEffect/useLayoutEffect 都在 Commit 之后**:区别在同步还是异步,但都不在 Render 阶段。
- **闭包陷阱**:Render 阶段每次都是新函数调用新闭包,所以 effect 捕获的是当次 render 的快照(第 1 题)。
- **memo/useMemo**:作用在 Render 阶段,决定要不要跳过某次 Render。memo 命中 = 跳过这个组件的 Render,直接复用上次结果。
- **并发渲染可中断**:指的就是 Render 阶段可中断,Commit 不可中断。

**5. 一个常见误区**

"React 渲染 = 浏览器渲染"是错的。React 的 Render 阶段是算虚拟 DOM 差异,不是浏览器 paint;浏览器 paint 发生在 React Commit 之后。两者是不同层面的"渲染"。

**6. 面试加分**

能讲出:"Render 阶段纯计算可中断(Concurrent 的基础),Commit 阶段同步动 DOM 不可中断(防半成品)。副作用严禁在 Render 阶段(可能重试导致多次执行),useLayoutEffect 同步跟在 Commit 后、useEffect 异步在绘制后。这套时序是理解所有 Hooks 时机问题的基础。"

### 参考答案

**两阶段:**
- **Render 阶段(协调)**:计算新虚拟 DOM、与上一次 Fiber 树 Diff 找变更。**纯计算、可中断、可重试**——Concurrent 并发渲染可打断的就是这个阶段。
- **Commit 阶段(提交)**:同步把变更应用到真实 DOM。**不可中断**,避免用户看到半成品。

**为什么这样分:** Render 是"算账"纯函数,中断重试不影响正确性,所以可拆片;Commit 是"动 DOM",改一半会出半成品,必须同步。

**副作用时机:**
- **Render 阶段禁止副作用**:可能被中断重试,副作用跑多次出 bug。组件函数体、useState 初始化、useMemo 计算都须保持纯。
- **Commit 之后**:useLayoutEffect 同步执行(绘制前),useEffect 异步执行(绘制后)。

**串联其他题:**
- useEffect/useLayoutEffect 都在 Commit 后,区别在同步/异步。
- 闭包陷阱根因:Render 阶段每次是新函数新闭包,effect 捕获当次快照。
- memo/useMemo 作用在 Render 阶段,决定是否跳过 Render。
- 并发渲染可中断 = Render 阶段可中断,Commit 不可。

**易混点:** React 的 Render(算虚拟 DOM)≠ 浏览器 paint(绘制像素),后者发生在 React Commit 之后,是不同层面。

---
