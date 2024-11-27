function checkLocation(position) {
  console.log('收到位置更新：', {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy
  });

  const userLatLng = new google.maps.LatLng(
    position.coords.latitude,
    position.coords.longitude
  );

  // 更新使用者位置標記
  const userPosition = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  if (!userMarker) {
    userMarker = new google.maps.Marker({
      position: userPosition,
      map: map,
      title: '您的位置',
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      }
    });
  } else {
    userMarker.setPosition(userPosition);
  }

  // 保持地圖中心在指定位置
  map.setCenter(TARGET_LOCATION);
  // 設定適當的縮放級別
  map.setZoom(18);

  // 檢查點是否在多邊形內
  if (google.maps.geometry.poly.containsLocation(userLatLng, boundaryShape)) {
    showNotification('已抵達現場！', '您已在指定區域內');
  } else {
    showNotification('不在現場', '您不在指定區域內');
  }
}

// 顯示通知
function showNotification(title, message) {
  // 如果瀏覽器支援 Notification API
  if ('Notification' in window) {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, { body: message });
      }
    });
  }
  
  // 同時在頁面上顯示
  const statusElement = document.getElementById('status');
  if (statusElement) {
    statusElement.textContent = `${title}: ${message}`;
  }
}

// 初始化並開始追蹤位置
async function startLocationTracking() {
  // 先請求位置權限
  try {
    const permission = await requestLocationPermission();
    if (permission !== 'granted') {
      showNotification('錯誤', '需要位置權限才能繼續');
      return;
    }
  } catch (error) {
    console.error('請求位置權限失敗：', error);
    showNotification('錯誤', '無法取得位置權限');
    return;
  }

  // 初始化地圖
  initMap();

  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
      checkLocation,
      (error) => {
        console.error('位置追蹤錯誤：', error);
        showNotification('錯誤', '無法取得位置資訊');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    showNotification('錯誤', '此瀏覽器不支援位置追蹤');
  }
}

// 請求位置權限
function requestLocationPermission() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('瀏覽器不支援地理位置功能'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      () => resolve('granted'),
      (error) => {
        console.error('位置權限錯誤：', error);
        reject(error);
      },
      { enableHighAccuracy: true }
    );
  });
}

// 頁面載入完成後自動開始
window.addEventListener('load', () => {
  startLocationTracking().catch(error => {
    console.error('初始化錯誤：', error);
    showNotification('錯誤', '初始化失敗，請重新整理頁面');
  });
});

// 添加更新半徑的函數
function updateRadius(newRadius) {
  RADIUS = newRadius;
  if (boundaryShape) {
    boundaryShape.setRadius(newRadius);
  }
}

// 添加回到中心點的函數
function centerOnTarget() {
  if (map) {
    map.setCenter(TARGET_LOCATION);
    map.setZoom(18);
  }
}

// 在 HTML 中可以添加一個控制半徑的輸入框：