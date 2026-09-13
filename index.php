<?php
// Ambil string User-Agent dari request pengunjung
$userAgent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '';

// Keyword bot mesin pencari utama
$pattern = '/Googlebot|Bingbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|Sogou|Exabot|facebot|facebookexternalhit/i';

// Logika pemisahan tampilan
if (preg_match($pattern, $userAgent)) {
    include 'konten_bot.php';
} else {
    include 'konten_manusia.php';
}
?>