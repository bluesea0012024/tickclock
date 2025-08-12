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
  
  // 初始化时钟尺寸
  initClockSize: function() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    const windowWidth = systemInfo.windowWidth;
    
    // 计算画布尺寸（以px为单位）
    // 增加尺寸比例，使时钟更大
    const canvasSize = windowWidth * 0.8;
    
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
    
    const ctx = wx.createCanvasContext('clockCanvas');
    const { clockRadius, centerX, centerY, hourAngle, minuteAngle, canvasWidth, canvasHeight } = this.data;
    
    // 使用实际分针角度，无需限制范围
    let safeMinuteAngle = minuteAngle;
    
    // 清空画布 - 使用动态计算的画布尺寸
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制时钟外圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius, 0, 2 * Math.PI);
    ctx.setFillStyle('#ffffff');
    ctx.fill();
    ctx.setLineWidth(clockRadius * 0.05);
    ctx.setStrokeStyle('#3A7FE0');
    ctx.stroke();
    
    // 绘制时钟刻度
    for (let i = 1; i <= 12; i++) {
      const angle = (i * Math.PI / 6) - Math.PI / 2;
      const x = centerX + (clockRadius - clockRadius*0.25) * Math.cos(angle);
      const y = centerY + (clockRadius - clockRadius*0.25) * Math.sin(angle);
      
      ctx.setFontSize(clockRadius*0.3);
      ctx.setFillStyle('#333333');
      ctx.setTextAlign('center');
      ctx.setTextBaseline('middle');
      ctx.fillText(i.toString(), x, y);
    }
    
    // 绘制分钟刻度和整点刻度
    for (let i = 0; i < 60; i++) {
      const angle = (i * Math.PI / 30) - Math.PI / 2;
      
      if (i % 5 === 0) { // 整点位置（小时刻度）
        // 只调整刻度线长度，保持起始点不变
        const outerRadius = clockRadius;
        const innerRadius = clockRadius - clockRadius*0.1;
        
        const outerX = centerX + outerRadius * Math.cos(angle);
        const outerY = centerY + outerRadius * Math.sin(angle);
        const innerX = centerX + innerRadius * Math.cos(angle);
        const innerY = centerY + innerRadius * Math.sin(angle);
        
        ctx.beginPath();
        ctx.moveTo(outerX, outerY);
        ctx.lineTo(innerX, innerY);
        ctx.setLineWidth(clockRadius * 0.03);
        ctx.setStrokeStyle('#333333');
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
        ctx.setLineWidth(clockRadius * 0.01);
        ctx.setStrokeStyle('#999999');
        ctx.stroke();
      }
    }
    
    // 计算当前时针和分针的角度
    const hourHandLength = clockRadius * 0.5;
    const minuteHandLength = clockRadius * 0.7;
    
    // 绘制时针（蓝色）
    const hourX = centerX + hourHandLength * Math.cos(hourAngle);
    const hourY = centerY + hourHandLength * Math.sin(hourAngle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(hourX, hourY);
    ctx.setLineWidth(clockRadius * 0.08);
    ctx.setStrokeStyle('#3A7FE0');
    ctx.stroke();
    
    // 绘制分针（红色）
    const minuteX = centerX + minuteHandLength * Math.cos(safeMinuteAngle);
    const minuteY = centerY + minuteHandLength * Math.sin(safeMinuteAngle);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(minuteX, minuteY);
    ctx.setLineWidth(clockRadius * 0.05);
    ctx.setStrokeStyle('#E74C3C');
    ctx.stroke();
    
    // 绘制中心点
    ctx.beginPath();
    ctx.arc(centerX, centerY, clockRadius * 0.1, 0, 2 * Math.PI);
    ctx.setFillStyle('#333333');
    ctx.fill();
    
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
    const { centerX, centerY, clockRadius } = this.data;
    
    // 计算触摸点到时钟中心的距离
    const dx = touch.x - centerX;
    const dy = touch.y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 判断触摸是否在时钟范围内
    if (distance < clockRadius) {
      // 计算触摸角度，转换为时钟坐标系（12点钟方向为0度，顺时针为正）
      const angle = Math.atan2(dy, dx) - Math.PI / 2;
      
      // 计算分针的端点坐标
      const minuteHandLength = clockRadius * 0.7;
      const minuteX = centerX + minuteHandLength * Math.cos(this.data.minuteAngle);
      const minuteY = centerY + minuteHandLength * Math.sin(this.data.minuteAngle);
      
      // 计算触摸点到分针端点的距离
      const minutePointDist = Math.sqrt(Math.pow(touch.x - minuteX, 2) + Math.pow(touch.y - minuteY, 2));
      
      // 判断是否接近分针
      const isNearMinuteHand = minutePointDist < clockRadius * 0.3 || distance > clockRadius * 0.5;
      
      // 初始化lastMinute，用于检测分针是否经过12点
      if (!this.lastMinute) {
        this.lastMinute = Math.round(((this.data.minuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
      }
      
      // 只允许拖动分针，不允许拖动时针
      this.setData({
        isDraggingHour: false,
        isDraggingMinute: isNearMinuteHand,
        lastTouchAngle: angle // 存储初始触摸角度
      });
      
      // 阻止事件冒泡和默认行为
      e.preventDefault && e.preventDefault();
      e.stopPropagation && e.stopPropagation();
    }
  },

  // 触摸移动事件
  touchMove: function(e) {
    const touch = e.touches[0];
    const { centerX, centerY, isDraggingMinute, lastTouchAngle, hourAngle } = this.data;
    
    // 如果正在拖动指针
    if (isDraggingMinute) {
      // 计算触摸点的角度，转换为时钟坐标系
      const dx = touch.x - centerX;
      const dy = touch.y - centerY;
      const angle = Math.atan2(dy, dx) - Math.PI / 2;
      
      // 计算两次触摸之间的角度差
      let angleDiff = angle - lastTouchAngle;
      
      // 处理角度跨越π/-π边界的情况，确保旋转平滑
      if (angleDiff > Math.PI) {
        angleDiff -= 2 * Math.PI;
      } else if (angleDiff < -Math.PI) {
        angleDiff += 2 * Math.PI;
      }
      
      // 计算新的分针角度，确保角度在合理范围内
      let newMinuteAngle = this.data.minuteAngle + angleDiff;
      
      // 允许分针无限制旋转，不限制角度范围
      
      // --- 更新时钟逻辑 ---
      // 计算分钟值（0-55，每5分钟一个刻度）
      let minute = Math.round(((newMinuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
      minute = ((minute % 60) + 60) % 60;
      minute = Math.round(minute / 5) * 5;
      if (minute === 60) minute = 0;
      
      // 根据分针位置计算小时，而不是使用旧的时针角度
      // 首先获取当前的小时值（基于分针位置）
      let hour = Math.floor(((this.data.hourAngle + Math.PI / 2) / (Math.PI / 6)) % 12);
      if (hour === 0) hour = 12;
      
      let newHour = hour;
      // 当分针经过12点时，更新小时
      if (this.lastMinute > 50 && minute < 10) {
        newHour = hour % 12 + 1;
      } else if (this.lastMinute < 10 && minute > 50) {
        newHour = (hour === 1) ? 12 : hour - 1;
      }
      
      this.lastMinute = minute;
      
      // 计算时针的精确角度，考虑分钟的影响
      const newHourAngle = ((newHour - 3) * (Math.PI / 6)) + (minute * (Math.PI / 360));
      
      this.setData({
        minuteAngle: newMinuteAngle,
        hourAngle: newHourAngle,
        currentHour: newHour,
        currentMinute: minute,
        lastTouchAngle: angle // 更新上一次的触摸角度
      });
      
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
        isDraggingMinute: false
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
    if (this.lastMinute > 50 && minute < 10) {
      hour = hour % 12 + 1;
    } else if (this.lastMinute < 10 && minute > 50) {
      hour = (hour - 2 + 12) % 12 + 1;
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
    
    // 重新绘制时钟
    this.drawClock();
  },

  // 检查答案
  checkAnswer: function() {
    // 增加总题目数
    this.setData({
      totalQuestions: this.data.totalQuestions + 1
    });
    
    // 调试信息：显示当前时间和目标时间
    console.log('当前时间:', this.data.currentHour + ':' + this.data.currentMinute);
    console.log('目标时间:', this.data.targetHour + ':' + this.data.targetMinute);
    console.log('分针角度:', this.data.minuteAngle);
    console.log('时针角度:', this.data.hourAngle);
    
    // 调用测试函数验证时间计算
    this.testTimeCalculation();
    
    // 验证时针角度计算
    this.validateHourCalculation();
    
    // 验证时针角度反向计算
    this.validateHourAngleReverse();
    
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
    wx.navigateTo({
      url: '/pages/certificate/certificate'
    });
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

  // 测试时间计算函数
  testTimeCalculation: function() {
    console.log('=== 时间计算测试 ===');
    console.log('分针角度:', this.data.minuteAngle);
    console.log('时针角度:', this.data.hourAngle);
    
    // 计算分钟
    let minute = Math.round(((this.data.minuteAngle + Math.PI / 2) / (Math.PI / 30)) % 60);
    minute = ((minute % 60) + 60) % 60;
    minute = Math.round(minute / 5) * 5;
    if (minute === 60) minute = 0;
    
    // 计算小时
    const hourAngleRad = this.data.hourAngle + Math.PI / 2;
    let hourDecimal = (hourAngleRad / (Math.PI / 6)) % 12;
    let hour = Math.floor(hourDecimal);
    if (hour === 0) hour = 12;
    
    console.log('计算出的时间:', hour + ':' + minute);
    console.log('当前存储的时间:', this.data.currentHour + ':' + this.data.currentMinute);
    console.log('目标时间:', this.data.targetHour + ':' + this.data.targetMinute);
    
    // 详细的角度分析
    console.log('--- 详细分析 ---');
    console.log('分针角度(弧度):', this.data.minuteAngle);
    console.log('分针角度(度):', (this.data.minuteAngle * 180 / Math.PI).toFixed(2));
    console.log('时针角度(弧度):', this.data.hourAngle);
    console.log('时针角度(度):', (this.data.hourAngle * 180 / Math.PI).toFixed(2));
    console.log('hourAngleRad:', hourAngleRad);
    console.log('hourDecimal:', hourDecimal);
    console.log('==================');
  },

  // 验证时针角度计算
  validateHourCalculation: function() {
    console.log('=== 时针角度验证 ===');
    
    // 测试不同小时的角度计算
    for (let h = 1; h <= 12; h++) {
      const expectedAngle = ((h - 3) * (Math.PI / 6));
      const calculatedHour = Math.floor(((expectedAngle + Math.PI / 2) / (Math.PI / 6)) % 12);
      const finalHour = calculatedHour === 0 ? 12 : calculatedHour;
      
      console.log(`小时 ${h}: 期望角度=${(expectedAngle * 180 / Math.PI).toFixed(2)}°, 计算小时=${finalHour}`);
    }
    
    console.log('当前时针角度:', (this.data.hourAngle * 180 / Math.PI).toFixed(2) + '°');
    console.log('==================');
  },

  // 验证时针角度反向计算
  validateHourAngleReverse: function() {
    console.log('=== 时针角度反向验证 ===');
    
    // 从当前时针角度反向计算小时
    const hourAngleRad = this.data.hourAngle + Math.PI / 2;
    let hourDecimal = (hourAngleRad / (Math.PI / 6)) % 12;
    let hour = Math.floor(hourDecimal);
    if (hour === 0) hour = 12;
    
    console.log('当前时针角度(弧度):', this.data.hourAngle);
    console.log('当前时针角度(度):', (this.data.hourAngle * 180 / Math.PI).toFixed(2));
    console.log('hourAngleRad:', hourAngleRad);
    console.log('hourDecimal:', hourDecimal);
    console.log('计算出的小时:', hour);
    
    // 验证11:30的时针角度应该是多少
    const expectedHourAngle = ((11 - 3) * (Math.PI / 6)) + (30 * (Math.PI / 360));
    console.log('11:30的期望时针角度(弧度):', expectedHourAngle);
    console.log('11:30的期望时针角度(度):', (expectedHourAngle * 180 / Math.PI).toFixed(2));
    
    console.log('==================');
  }
});