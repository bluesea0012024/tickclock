// pages/index/index.js
Page({
  data: {
    // 时钟相关数据
    canvasWidth: 300, // 画布宽度
    canvasHeight: 300, // 画布高度
    clockRadius: 120, // 时钟半径
    centerX: 150, // 时钟中心X坐标
    centerY: 150, // 时钟中心Y坐标
    hourAngle: 0, // 时针角度
    minuteAngle: 0, // 分针角度
    currentHour: 12, // 当前小时
    currentMinute: 0, // 当前分钟
    targetHour: 12, // 目标小时
    targetMinute: 0, // 目标分钟
    targetTime: "12:00", // 目标时间显示
    dragOffset: 0, // 拖拽偏移量
    
    // 游戏相关数据
    correctCount: 0, // 正确次数
    totalQuestions: 0, // 总题目数
    startTime: null, // 开始时间
    endTime: null, // 结束时间
    hasCertificate: false, // 是否有奖状
    
    // 昵称相关
    nickname: "玩家1", // 默认昵称
    showNicknameModal: false, // 是否显示昵称输入框
  },

  onLoad: function() {
    // 获取全局数据
    const app = getApp();
    this.setData({
      nickname: app.globalData.nickname,
      hasCertificate: wx.getStorageSync('hasCertificate') || false
    });
    
    // 加载中心猴子图片
    this.loadMonkeyImage();
    
    // 获取设备信息，动态计算时钟尺寸
    this.initClockSize();
    
    // 初始化游戏
    this.initGame();
    
    // 初始化lastMinute变量，用于检测分针是否经过12点
    this.lastMinute = 0;
    
    // 确保初始角度正确 - 设置为6点整
    this.setData({
      hourAngle: Math.PI / 2, // 6点位置
      minuteAngle: 0 // 12点位置（分针指向12）
    });
    
    // 绘制时钟
    this.drawClock();
  },
  
  // 加载中心猴子图片
  loadMonkeyImage: function() {
    const that = this;
    // 直接设置图片路径
    that.monkeyPath = '/pages/index/images/monkey1.jpg';
    // 重新绘制时钟以显示猴子图片
    that.drawClock();
  },
  
  // 初始化时钟尺寸
  initClockSize: function() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    const windowWidth = systemInfo.windowWidth;
    
    // 计算画布尺寸（以px为单位）
    // 增加尺寸比例，使时钟更大 - 再调大10%
    const canvasSize = windowWidth * 0.968;
    
    // 计算时钟参数
    const clockRadius = canvasSize * 0.45;
    const centerX = canvasSize / 2;
    const centerY = canvasSize / 2;
    
    // 更新数据
    this.setData({
      canvasWidth: canvasSize,
      canvasHeight: canvasSize,
      clockRadius: clockRadius,
      centerX: centerX,
      centerY: centerY
    });
  },
  
  onShow: function() {
    // 页面显示时重新检查是否有奖状
    this.setData({
      hasCertificate: wx.getStorageSync('hasCertificate') || false
    });
  },

  // 页面隐藏时清理内存
  onHide: function() {
    // 清理缓存数据
    this.lastDrawTime = null;
    this.monkeyPath = null;
    // 清理canvas context缓存
    this.canvasContext = null;
  },

  // 页面卸载时清理内存
  onUnload: function() {
    // 清理所有缓存数据
    this.lastDrawTime = null;
    this.monkeyPath = null;
    this.canvasContext = null;
    this.lastMinute = null;
  },

  // 初始化游戏
  initGame: function() {
    // 记录开始时间
    const startTime = new Date();
    getApp().globalData.startTime = startTime;
    
    // 生成随机目标时间
    this.generateTargetTime();
    
    // 重置正确次数
    this.setData({
      correctCount: 0,
      totalQuestions: 0
    });
  },

  // 生成随机目标时间
  generateTargetTime: function() {
    // 随机生成小时（1-12）
    const hour = Math.floor(Math.random() * 12) + 1;
    
    // 随机生成分钟（0, 5, 10, ..., 55）
    const minute = Math.floor(Math.random() * 12) * 5;
    
    // 格式化时间显示
    const formattedMinute = minute < 10 ? `0${minute}` : minute;
    const targetTime = `${hour}:${formattedMinute}`;
    
    this.setData({
      targetHour: hour,
      targetMinute: minute,
      targetTime: targetTime
    });
  },

  // 绘制时钟
  drawClock: function() {
    // 验证和修复角度
    this.validateAndFixAngles();
    
    // 复用canvas context以减少内存开销
    if (!this.canvasContext) {
      this.canvasContext = wx.createCanvasContext('clockCanvas');
    }
    const ctx = this.canvasContext;
    const { clockRadius, centerX, centerY, hourAngle, minuteAngle, canvasWidth, canvasHeight } = this.data;
    
    // 使用实际分针角度，无需限制范围
    let safeMinuteAngle = minuteAngle;
    
    // 清空画布 - 使用动态计算的画布尺寸
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制时钟外圈 - 使用 Medium Turquoise 边框色创建统一的色彩方案
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, 2 * Math.PI);
    ctx.setFillStyle('#ffffff');
    ctx.fill();
    ctx.setLineWidth(clockRadius * 0.15);
    ctx.setStrokeStyle('#48D1CC'); // Medium Turquoise 边框，与导航栏颜色保持一致
    ctx.stroke();
    
    // 绘制时钟刻度 - 彩色数字，每个数字使用独特的鲜艾颜色
    const numberColors = ['#FF6B6B', '#FF8E53', '#FFEAA7', '#96CEB4', '#4ECDC4', '#45B7D1', 
                         '#DDA0DD', '#FFB6C1', '#98FB98', '#F0E68C', '#DEB887', '#FA8072'];
    
    // 定义12个水果图标，对应1-12点
    const fruitEmojis = ['🍇', '🍊', '🍌', '🍉',  '🥥', '🥝', '🍑', '🍒', '🥭', '🍍','🍓', '🍎'];
    
    for (let i = 1; i <= 12; i++) {
      const angle = (i * Math.PI / 6) - Math.PI / 2;
      const x = centerX + (clockRadius - clockRadius*0.25) * Math.cos(angle);
      const y = centerY + (clockRadius - clockRadius*0.25) * Math.sin(angle);
      
      // 绘制水果图标（在表盘外圈附近）
      const fruitX = centerX + (clockRadius + clockRadius*0.03) * Math.cos(angle);
      const fruitY = centerY + (clockRadius + clockRadius*0.03) * Math.sin(angle);
      ctx.setFontSize(clockRadius*0.18); // 水果图标大小
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText(fruitEmojis[i-1], fruitX, fruitY);
      
      // 绘制数字
      ctx.setFontSize(clockRadius*0.2304);
      ctx.setFillStyle(numberColors[i-1]); // 使用彩色数字
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText(i.toString(), x, y);
    }
    
    // 绘制分钟刻度和整点刻度 - 彩色刻度
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI / 30) - Math.PI / 2;
      
      if (i % 5 === 0) { // 整点位置（小时刻度）
        const outerRadius = clockRadius - clockRadius*0.08; // 缩短外半径，让边框覆盖刻度线
        const innerRadius = clockRadius - clockRadius*0.2;
        
        const outerX = centerX + outerRadius * Math.cos(angle);
        const outerY = centerY + outerRadius * Math.sin(angle);
        const innerX = centerX + innerRadius * Math.cos(angle);
        const innerY = centerY + innerRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
        ctx.setLineWidth(clockRadius * 0.04);
        ctx.setStrokeStyle('#FF6B6B'); // 红色小时刻度
        ctx.stroke();
      } else { // 普通分钟刻度
        const outerRadius = clockRadius - clockRadius*0.08;
        const innerRadius = clockRadius - clockRadius*0.15;
        
        const outerX = centerX + outerRadius * Math.cos(angle);
        const outerY = centerY + outerRadius * Math.sin(angle);
        const innerX = centerX + innerRadius * Math.cos(angle);
        const innerY = centerY + innerRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
        ctx.setLineWidth(clockRadius * 0.015);
        ctx.setStrokeStyle('#87CEEB'); // 天蓝色分钟刻度
        ctx.stroke();
      }
    }
    
    // 计算当前时针和分针的角度
    const hourHandLength = clockRadius * 0.5;
    const minuteHandLength = clockRadius * 0.7;
    
    // 绘制时针（紫色渐变）
    const hourX = centerX + hourHandLength * Math.cos(hourAngle);
    const hourY = centerY + hourHandLength * Math.sin(hourAngle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(hourX, hourY);
    ctx.setLineWidth(clockRadius * 0.08);
    ctx.setStrokeStyle('#6C5CE7'); // 紫色时针
    ctx.setLineCap('round'); // 圆滑线帽
    ctx.stroke();
    
    // 绘制分针（红色渐变）
    const minuteX = centerX + minuteHandLength * Math.cos(safeMinuteAngle);
    const minuteY = centerY + minuteHandLength * Math.sin(safeMinuteAngle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(minuteX, minuteY);
    ctx.setLineWidth(clockRadius * 0.05);
    ctx.setStrokeStyle('#FF6B6B'); // 红色分针
    ctx.setLineCap('round'); // 圆滑线帽
    ctx.stroke();
    
    // 绘制中心点（金色）
    if (this.monkeyPath) {
        // 如果有小猴子图片，绘制在中心
        const monkeySize = clockRadius * 0.25; // 增大尺寸从0.15到0.25 (增加约67%)
        ctx.drawImage(
            this.monkeyPath,
            centerX - monkeySize / 2,
            centerY - monkeySize / 2,
            monkeySize,
            monkeySize
        );
    } else {
        // 如果图片未加载完成，绘制一个金色的中心点
        ctx.beginPath();
        ctx.arc(centerX, centerY, clockRadius * 0.1, 0, 2 * Math.PI);
        ctx.setFillStyle('#FFD700'); // 金色中心
        ctx.fill();
    }
    
    // 添加装饰性元素 - 在时钟周围绘制小星星（已移除）
    // if (!this.data.isDraggingMinute && !this.data.isDraggingHour) {
    //   this.drawDecorativeStars(ctx, centerX, centerY, clockRadius);
    // }
    
    // 更新当前时间
    this.updateCurrentTime();
    
    // 绘制完成
    ctx.draw();
  },

  // 更新当前时间
  updateCurrentTime: function() {
    // 根据分针角度计算分钟，与touchMove中的逻辑保持一致
    let minute = Math.round(((this.data.minuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
    minute = ((minute % 60) + 60) % 60;
    minute = Math.round(minute / 5) * 5; // 对齐到5分钟刻度
    if (minute === 60) minute = 0;
    
    // 根据时针角度计算小时，与touchMove中的逻辑保持一致
    // 首先获取时针的原始角度（弧度）
    const hourAngleRad = this.data.hourAngle + Math.PI / 2;
    
    // 将角度转换为小时（0-11.99）
    let hourDecimal = (hourAngleRad / (Math.PI / 6)) % 12;
    
    // 使用Math.floor而不是Math.round，避免四舍五入错误
    let hour = Math.floor(hourDecimal);
    
    // 修正小时
    if (hour === 0) hour = 12;
    
    // 更新数据
    this.setData({
      currentHour: hour,
      currentMinute: minute
    });
  },

  // 触摸开始事件
  touchStart: function(e) {
    const touch = e.touches[0];
    const { centerX, centerY, clockRadius, hourAngle, minuteAngle } = this.data;
    
    // 计算触摸点到时钟中心的距离
    const dx = touch.x - centerX;
    const dy = touch.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 判断触摸是否在时钟范围内（扩大触摸范围）
    if (distance < clockRadius * 1.2) {
      // 计算触摸角度，转换为时钟坐标系（12点钟方向为0度，顺时针为正）
      const touchAngle = Math.atan2(dy, dx) - Math.PI / 2;
      
      // 计算时针和分针的端点坐标
      const hourHandLength = clockRadius * 0.5;
      const minuteHandLength = clockRadius * 0.7;
      
      const hourX = centerX + hourHandLength * Math.cos(hourAngle);
      const hourY = centerY + hourHandLength * Math.sin(hourAngle);
      const minuteX = centerX + minuteHandLength * Math.cos(minuteAngle);
      const minuteY = centerY + minuteHandLength * Math.sin(minuteAngle);
      
      // 计算触摸点到各指针端点的距离
      const hourPointDist = Math.sqrt(Math.pow(touch.x - hourX, 2) + Math.pow(touch.y - hourY, 2));
      const minutePointDist = Math.sqrt(Math.pow(touch.x - minuteX, 2) + Math.pow(touch.y - minuteY, 2));
      
      // 判断离哪个指针更近，或者根据触摸位置决定
      const isNearHourHand = hourPointDist < clockRadius * 0.4 && (distance < clockRadius * 0.6 || hourPointDist < minutePointDist);
      const isNearMinuteHand = minutePointDist < clockRadius * 0.4 && !isNearHourHand;
      
      // 初始化lastMinute，修复初始化问题
      if (this.lastMinute === undefined || this.lastMinute === null) {
        this.lastMinute = Math.round(((minuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
      }
      
      // 计算拖拽偏移量，避免手部跳动
      let dragOffset = 0;
      if (isNearMinuteHand) {
        dragOffset = touchAngle - minuteAngle;
      } else if (isNearHourHand) {
        dragOffset = touchAngle - hourAngle;
      }
      
      // 允许拖动时针或分针
      this.setData({
        isDraggingHour: isNearHourHand,
        isDraggingMinute: isNearMinuteHand,
        dragOffset: dragOffset // 存储拖拽偏移量
      });
      
      // 阻止事件冒泡和默认行为
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
    }
  },

  // 触摸移动事件
  touchMove: function(e) {
    const touch = e.touches[0];
    const { centerX, centerY, isDraggingHour, isDraggingMinute, hourAngle, minuteAngle, dragOffset } = this.data;
    
    // 如果正在拖动指针
    if (isDraggingHour || isDraggingMinute) {
      // 节流处理：限制重绘频率，防止内存溢出
      const now = Date.now();
      if (this.lastDrawTime && now - this.lastDrawTime < 16) { // 限制为60FPS
        return;
      }
      this.lastDrawTime = now;
      
      // 计算触摸点的角度，转换为时钟坐标系
      const dx = touch.x - centerX;
      const dy = touch.y - centerY;
      const touchAngle = Math.atan2(dy, dx) - Math.PI / 2;
      
      // 使用拖拽偏移量计算新的手部角度
      const newAngle = touchAngle - dragOffset;
      
      if (isDraggingMinute) {
        // 拖动分针
        let newMinuteAngle = newAngle;
        
        // 计算分钟值（0-55，每5分钟一个刻度）
        let minute = Math.round(((newMinuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
        minute = ((minute % 60) + 60) % 60;
        minute = Math.round(minute / 5) * 5;
        if (minute === 60) minute = 0;
        
        // 更新lastMinute
        this.lastMinute = minute;
        
        this.setData({
          minuteAngle: newMinuteAngle,
          currentMinute: minute
        });
        
      } else if (isDraggingHour) {
        // 拖动时针
        let newHourAngle = newAngle;
        
        // 计算小时值（1-12）
        let hour = Math.round(((newHourAngle + Math.PI / 2) / (Math.PI / 6)) % 12);
        hour = ((hour % 12) + 12) % 12;
        if (hour === 0) hour = 12;
        
        this.setData({
          hourAngle: newHourAngle,
          currentHour: hour
        });
      }
      
      // 验证和修复角度
      this.validateAndFixAngles();
      
      // 重新绘制时钟
      this.drawClock();
      
      // 阻止事件冒泡和默认行为
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      return false;
    }
  },

  // 触摸结束事件
  touchEnd: function(e) {
    // 如果正在拖动指针
    if (this.data.isDraggingHour || this.data.isDraggingMinute) {
      
      // 重置拖动状态
      this.setData({
        isDraggingHour: false,
        isDraggingMinute: false,
        dragOffset: 0 // 重置拖拽偏移量
      });
      
      // 对齐到最近的刻度
      this.snapToNearestTick();
      
      // 阻止事件冒泡和默认行为
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
      return false;
    }
  },

  // 对齐到最近的刻度
  snapToNearestTick: function() {
    const { isDraggingHour, isDraggingMinute } = this.data;
    
    if (isDraggingMinute || !isDraggingHour) {
      // 对齐分针到最近的5分钟刻度
      // 计算当前分钟值
      let currentMinute = Math.round(((this.data.minuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
      currentMinute = ((currentMinute % 60) + 60) % 60;
      
      // 对齐到最近的5分钟
      let minute = Math.round(currentMinute / 5) * 5;
      if (minute === 60) minute = 0;
      
      // 计算对齐后的分针角度
      const minuteAngle = ((minute * Math.PI / 30) - Math.PI / 2);
      
      // 获取当前小时值（1-12）
      let hour = Math.floor(((this.data.hourAngle + Math.PI / 2) / (Math.PI / 6)) % 12);
      if (hour === 0) hour = 12;
      
      // 检查分针是否跨过12点，如果是则调整小时
      if (this.lastMinute !== undefined && this.lastMinute !== null) {
        if (this.lastMinute > 50 && minute < 10) {
          hour = hour % 12 + 1;
        } else if (this.lastMinute < 10 && minute > 50) {
          hour = (hour - 2 + 12) % 12 + 1;
        }
      }
      
      // 更新lastMinute
      this.lastMinute = minute;
      
      // 计算时针的精确角度，考虑分钟的影响
      // 时针每小时旋转30度(π/6)，每分钟额外旋转0.5度(π/360)
      const hourAngle = ((hour - 3) * (Math.PI / 6)) + (minute * (Math.PI / 360));
      
      this.setData({
        hourAngle: hourAngle,
        minuteAngle: minuteAngle,
        currentHour: hour,
        currentMinute: minute
      });
    } else if (isDraggingHour) {
      // 对齐时针到最近的小时刻度
      // 计算当前小时值
      let hour = Math.round(((this.data.hourAngle + Math.PI / 2) / (Math.PI / 6)) % 12);
      hour = ((hour % 12) + 12) % 12;
      if (hour === 0) hour = 12;
      
      // 保持当前分钟不变
      const currentMinute = this.data.currentMinute;
      
      // 计算对齐后的时针角度
      const hourAngle = ((hour - 3) * (Math.PI / 6)) + (currentMinute * (Math.PI / 360));
      
      this.setData({
        hourAngle: hourAngle,
        currentHour: hour
      });
    }
    
    // 重新绘制时钟
    this.drawClock();
  },

  // 检查答案
  checkAnswer: function() {
    // 增加总题目数
    this.setData({
      totalQuestions: this.data.totalQuestions + 1
    });
    
    // 已移除所有console.log语句以优化内存使用
    
    // 检查当前时间是否与目标时间匹配
    if (this.data.currentHour === this.data.targetHour && 
        this.data.currentMinute === this.data.targetMinute) {
      // 答对了，增加正确次数
      const newCorrectCount = this.data.correctCount + 1;
      
      this.setData({
        correctCount: newCorrectCount
      });
      
      // 显示成功提示
      wx.showToast({
        title: '答对了！',
        icon: 'success'
      });
      
      // 如果答对5次，直接跳转到奖状页面
      if (newCorrectCount >= 5) {
        // 记录结束时间
        const endTime = new Date();
        getApp().globalData.endTime = endTime;
        getApp().globalData.correctCount = newCorrectCount;
        getApp().globalData.totalQuestions = this.data.totalQuestions;
        
        // 检查是否首次获得奖状
        if (!this.data.hasCertificate) {
          // 显示昵称输入框
          this.setData({
            showNicknameModal: true
          });
        } else {
          // 直接跳转到奖状页面
          wx.navigateTo({
            url: '/pages/certificate/certificate'
          });
        }
      } else {
        // 生成新的目标时间
        this.generateTargetTime();
      }
    } else {
      // 答错了，显示提示
      wx.showToast({
        title: '再试一次',
        icon: 'none'
      });
    }
  },

  // 重置游戏
  resetGame: function() {
    this.initGame();
    
    // 重置时钟指针到6点整
    this.setData({
      hourAngle: Math.PI / 2, // 6点位置
      minuteAngle: 0 // 12点位置
    });
    
    // 重新绘制时钟
    this.drawClock();
  },

  // 查看奖状
  viewCertificate: function() {
    // 检查是否有奖状
    const hasCertificate = wx.getStorageSync('hasCertificate') || false;
    
    if (hasCertificate) {
      // 有奖状，直接跳转
      wx.navigateTo({
        url: '/pages/certificate/certificate'
      });
    } else {
      // 没有奖状，显示提示信息
      wx.showModal({
        title: '奖状尚未获得',
        content: '请继续答题！答对5道题即可获得精美奖状。\n\n当前进度：' + this.data.correctCount + '/5',
        showCancel: false,
        confirmText: '继续努力',
        confirmColor: '#4ECDC4'
      });
    }
  },

  // 昵称输入事件
  onNicknameInput: function(e) {
    this.setData({
      nickname: e.detail.value
    });
  },

  // 提交昵称
  submitNickname: function() {
    const nickname = this.data.nickname || '玩家1';
    
    // 保存昵称到本地存储和全局数据
    wx.setStorageSync('nickname', nickname);
    getApp().globalData.nickname = nickname;
    
    // 标记已获得奖状
    wx.setStorageSync('hasCertificate', true);
    
    // 隐藏昵称输入框
    this.setData({
      showNicknameModal: false,
      hasCertificate: true
    });
    
    // 直接跳转到奖状页面
    wx.navigateTo({
      url: '/pages/certificate/certificate'
    });
  },

  // 验证和修复角度计算
  validateAndFixAngles: function() {
    let { hourAngle } = this.data;
    let changed = false;
    
    // 只修复时针角度范围，分针可以无限旋转
    while (hourAngle < -Math.PI / 2) {
      hourAngle += 2 * Math.PI;
      changed = true;
    }
    while (hourAngle > 3 * Math.PI / 2) {
      hourAngle -= 2 * Math.PI;
      changed = true;
    }
    
    // 如果时针角度有变化，更新数据
    if (changed) {
      this.setData({
        hourAngle: hourAngle
      });
      return true; // 表示角度被修复了
    }
    
    return false; // 表示角度正常
  },

  // 测试时间计算函数（仅用于开发环境，生产环境已移除日志输出）
  testTimeCalculation: function() {
    // 已移除所有console.log语句以优化内存使用
  },

  // 验证时针角度计算（仅用于开发环境，生产环境已移除日志输出）
  validateHourCalculation: function() {
    // 已移除所有console.log语句以优化内存使用
  },

  // 验证时针角度反向计算（仅用于开发环境，生产环境已移除日志输出）
  validateHourAngleReverse: function() {
    // 已移除所有console.log语句以优化内存使用
  },
  
  // 绘制装饰性小星星（优化版本，减少星星数量以节约内存）
  drawDecorativeStars: function(ctx, centerX, centerY, clockRadius) {
    // 缓存静态数据以减少重复创建
    if (!this.starCache) {
      this.starCache = {
        colors: ['#FFD700', '#FF69B4', '#00CED1', '#98FB98', '#DDA0DD', '#F0E68C'],
        positions: [
          { angle: 0, distance: 1.3 },
          { angle: 2 * Math.PI / 3, distance: 1.35 },
          { angle: 4 * Math.PI / 3, distance: 1.25 },
          { angle: Math.PI, distance: 1.3 }
        ]
      };
    }
    
    this.starCache.positions.forEach((star, index) => {
      const x = centerX + clockRadius * star.distance * Math.cos(star.angle);
      const y = centerY + clockRadius * star.distance * Math.sin(star.angle);
      
      this.drawStar(ctx, x, y, clockRadius * 0.06, this.starCache.colors[index]);
    });
  },
  
  // 绘制单个星星（优化版本，减少路径复杂度）
  drawStar: function(ctx, x, y, size, color) {
    ctx.save();
    ctx.translate(x, y);
    
    // 使用简化的星形绘制，减少计算量
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.3, -size * 0.3);
    ctx.lineTo(size, 0);
    ctx.lineTo(size * 0.3, size * 0.3);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.3, size * 0.3);
    ctx.lineTo(-size, 0);
    ctx.lineTo(-size * 0.3, -size * 0.3);
    ctx.closePath();
    
    ctx.setFillStyle(color);
    ctx.fill();
    
    ctx.restore();
  },
  
  // 新增：未上线功能提示
  comingSoon: function() {
    wx.showToast({
      title: '即将上线，敬请期待',
      icon: 'none'
    });
  },
  
  // 测试功能：手动启用奖状（仅用于演示）
  enableCertificateForDemo: function() {
    wx.setStorageSync('hasCertificate', true);
    this.setData({
      hasCertificate: true,
      correctCount: 5
    });
    wx.showToast({
      title: '奖状已启用（演示模式）',
      icon: 'success'
    });
  },
  
  // 跳转到汉诺塔小程序
  goToHanoi: function() {
    wx.navigateToMiniProgram({
      appId: 'wx4f87b8582ddf6b04', // 需要替换为汉诺塔小程序的实际appid
      path: '/hanoi/hanoi',
      success: () => {},
      fail: () => {
        wx.showToast({ title: '跳转失败', icon: 'none' });
      }
    });
  }
});