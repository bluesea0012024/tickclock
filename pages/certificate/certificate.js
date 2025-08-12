// pages/certificate/certificate.js
Page({
  data: {
    nickname: '玩家1',
    scorePercent: 0,
    elapsedTime: 0,
    beatPercent: 85, // 模拟超越其他玩家的百分比
    currentDate: '',
    showNicknameModal: false,
    newNickname: ''
  },

  onLoad: function() {
    // 获取全局数据
    const app = getApp();
    const nickname = app.globalData.nickname || '玩家1';
    const correctCount = app.globalData.correctCount || 0;
    const totalQuestions = app.globalData.totalQuestions || 0;
    const startTime = app.globalData.startTime;
    const endTime = app.globalData.endTime;
    
    // 计算分数百分比
    let scorePercent = 0;
    if (totalQuestions > 0) {
      scorePercent = Math.round((correctCount / totalQuestions) * 100);
    }
    
    // 计算用时（秒）
    let elapsedTime = 0;
    if (startTime && endTime) {
      elapsedTime = Math.round((endTime - startTime) / 1000);
    }
    
    // 生成随机的超越百分比（实际应用中可能需要与服务器通信获取真实数据）
    const beatPercent = Math.floor(Math.random() * 30) + 70; // 70-99之间的随机数
    
    // 获取当前日期
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const currentDate = `${year}年${month}月${day}日`;
    
    // 更新数据
    this.setData({
      nickname: nickname,
      scorePercent: scorePercent,
      elapsedTime: elapsedTime,
      beatPercent: beatPercent,
      currentDate: currentDate,
      newNickname: nickname
    });
  },

  // 返回首页
  backToHome: function() {
    wx.navigateBack({
      delta: 2 // 返回两层，回到首页
    });
  },

  // 显示修改昵称弹窗
  modifyNickname: function() {
    this.setData({
      showNicknameModal: true
    });
  },

  // 昵称输入事件
  onNicknameInput: function(e) {
    this.setData({
      newNickname: e.detail.value
    });
  },

  // 提交新昵称
  submitNickname: function() {
    const newNickname = this.data.newNickname || '玩家1';
    
    // 保存昵称到本地存储和全局数据
    wx.setStorageSync('nickname', newNickname);
    getApp().globalData.nickname = newNickname;
    
    // 更新页面显示
    this.setData({
      nickname: newNickname,
      showNicknameModal: false
    });
    
    // 显示提示
    wx.showToast({
      title: '昵称已修改',
      icon: 'success'
    });
  },

  // 分享功能
  onShareAppMessage: function() {
    return {
      title: `${this.data.nickname}在认识时钟小程序中获得了奖状！`,
      path: '/pages/index/index',
      imageUrl: '/assets/share-image.png' // 分享图片（需要提前准备）
    };
  }
});