// 指定地點的座標
const TARGET_LOCATION = {
  lat: 25.044798,  // 替換成你的目標緯度
  lng: 121.560164 // 替換成你的目標經度
};

const RADIUS = 50; // 半徑（公尺）

let map;
let userMarker;
let targetMarker;
let boundaryShape;

// 初始化地圖
function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 18,
    center: TARGET_LOCATION,
    mapTypeId: 'roadmap'
  });

  // 添加目標位置標記
  targetMarker = new google.maps.Marker({
    position: TARGET_LOCATION,
    map: map,
    title: '目標位置',
    icon: {
      url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    }
  });

  // 定義多邊形範圍（例如：矩形區域）
  const bounds = [
    { lat: TARGET_LOCATION.lat + 0.00012, lng: TARGET_LOCATION.lng + 0.00018 }, // 右上
    { lat: TARGET_LOCATION.lat + 0.000125, lng: TARGET_LOCATION.lng - 0.00018 }, // 左上
    { lat: TARGET_LOCATION.lat - 0.0005, lng: TARGET_LOCATION.lng - 0.00019 }, // 左下
    { lat: TARGET_LOCATION.lat - 0.0005, lng: TARGET_LOCATION.lng + 0.000175 }  // 右下
  ];

  // 創建多邊形
  boundaryShape = new google.maps.Polygon({
    paths: bounds,
    map: map,
    fillColor: '#FF0000',
    fillOpacity: 0.2,
    strokeColor: '#FF0000',
    strokeOpacity: 1,
    strokeWeight: 2
  });
}

// 計算兩點之間的距離（使用 Haversine 公式）
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // 地球半徑（公尺）
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 返回公尺
}

// 檢查是否在範圍內
function checkLocation(position) {
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
      },
      // 加入精確度圓圈
      circle: new google.maps.Circle({
        map: map,
        radius: position.coords.accuracy, // 使用定位精確度作為半徑
        fillColor: '#0000FF',
        fillOpacity: 0.1,
        strokeColor: '#0000FF',
        strokeOpacity: 0.5,
        strokeWeight: 1
      })
    });
  } else {
    userMarker.setPosition(userPosition);
    // 更新精確度圓圈
    if (userMarker.circle) {
      userMarker.circle.setCenter(userPosition);
      userMarker.circle.setRadius(position.coords.accuracy);
    }
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

// 開始追蹤位置
function startLocationTracking() {
  // 初始化地圖
  if (!map) {
    initMap();
  }

  if ('geolocation' in navigator) {
    navigator.geolocation.watchPosition(
      checkLocation,
      (error) => {
        console.error('位置追蹤錯誤：', error);
        showNotification('錯誤', '無法取得位置資訊');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  } else {
    showNotification('錯誤', '此瀏覽器不支援位置追蹤');
  }
}

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