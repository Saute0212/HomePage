//ヘッダーの高さが変更されるたびに実行される関数
function updateMainPadding() {
    var headerHeight = document.querySelector('header').offsetHeight; //ヘッダーの高さを取得
    var footerHeight = document.querySelector('footer').offsetHeight; //フッターの高さを取得
    var mainContent = document.querySelector('.site-main'); //メインコンテンツの要素を取得

    //ヘッダーの高さに合わせてメインコンテンツのpadding-topとmin-heightを更新
    mainContent.style.paddingTop = headerHeight + 'px';
    mainContent.style.minHeight = 'calc(100vh - ' + (headerHeight + footerHeight) + 'px)';
}

//ページの読み込み時とリサイズ時に実行
window.addEventListener('load', updateMainPadding);
window.addEventListener('resize', updateMainPadding);

//ヘッダーの高さがアニメーションで変更されるときに、padding-topやmin-heightを調整
document.querySelector('header').addEventListener('transitionend', updateMainPadding);
