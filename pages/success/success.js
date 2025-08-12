// pages/success/success.js
Page({
  data: {
    scorePercent: 0,
    elapsedTime: 0
  },

  onLoad: function() {
    // 获取全局数据
    const app = getApp();
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
    
    // 更新数据
    this.setData({
      scorePercent: scorePercent,
      elapsedTime: elapsedTime
    });
  },

  // 再玩一次
  playAgain: function() {
    // 重置全局数据
    const app = getApp();
    app.globalData.correctCount = 0;
    app.globalData.totalQuestions = 0;
    app.globalData.startTime = new Date();
    app.globalData.endTime = null;
    
    // 返回首页
    wx.navigateBack({
      delta: 1
    });
  },

  // 返回首页
  backToHome: function() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 查看奖状
  viewCertificate: function() {
    wx.navigateTo({
      url: '/pages/certificate/certificate'
    });
  }
});