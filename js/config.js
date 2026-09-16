window.App = window.App || {};

App.CATS = {
  exit:       { label:'出入境須知', color:'var(--c-exit)',       hex:'#2454A6' },
  customs:    { label:'當地風俗',   color:'var(--c-customs)',    hex:'#1D8A6C' },
  precaution: { label:'注意事項',   color:'var(--c-precaution)', hex:'#B5720E' },
  reflection: { label:'旅遊心得',   color:'var(--c-reflection)', hex:'#B23568' }
};
App.CAT_ORDER = ['exit','customs','precaution','reflection'];

// 常見國家（含慣用中文名稱／簡稱）對應 ISO 國碼，用來組出國旗圖片網址；找不到就不顯示
App.COUNTRY_CODES = {
  '台灣':'tw','中華民國':'tw','中國':'cn','中國大陸':'cn','香港':'hk','澳門':'mo',
  '日本':'jp','韓國':'kr','南韓':'kr','北韓':'kp',
  '泰國':'th','越南':'vn','新加坡':'sg','馬來西亞':'my','印尼':'id','菲律賓':'ph',
  '柬埔寨':'kh','寮國':'la','老撾':'la','緬甸':'mm','汶萊':'bn','東帝汶':'tl',
  '印度':'in','尼泊爾':'np','不丹':'bt','斯里蘭卡':'lk','巴基斯坦':'pk','孟加拉':'bd','蒙古':'mn',
  '美國':'us','加拿大':'ca','墨西哥':'mx','古巴':'cu',
  '英國':'gb','法國':'fr','德國':'de','義大利':'it','西班牙':'es','葡萄牙':'pt',
  '荷蘭':'nl','比利時':'be','瑞士':'ch','奧地利':'at','希臘':'gr',
  '瑞典':'se','挪威':'no','丹麥':'dk','芬蘭':'fi','冰島':'is','愛爾蘭':'ie',
  '波蘭':'pl','捷克':'cz','匈牙利':'hu','俄羅斯':'ru','土耳其':'tr','克羅埃西亞':'hr',
  '澳洲':'au','紐西蘭':'nz',
  '埃及':'eg','摩洛哥':'ma','南非':'za','肯亞':'ke',
  '杜拜':'ae','阿拉伯聯合大公國':'ae','沙烏地阿拉伯':'sa','以色列':'il','約旦':'jo','卡達':'qa',
  '巴西':'br','阿根廷':'ar','智利':'cl','秘魯':'pe','哥倫比亞':'co'
};

App.countryCode = function(name){
  if(!name) return '';
  var key = name.trim().replace(/臺/g, '台'); // 「臺」是「台」的異體字，統一比對，避免打「臺灣」對不到「台灣」
  if(!key) return '';
  if(App.COUNTRY_CODES[key]) return App.COUNTRY_CODES[key];
  for(var k in App.COUNTRY_CODES){
    if(key.indexOf(k) !== -1) return App.COUNTRY_CODES[k];
  }
  return '';
};
