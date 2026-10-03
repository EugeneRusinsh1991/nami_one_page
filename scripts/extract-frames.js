const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

let ffmpegPath = '';
try {
  ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
} catch (e) {
  ffmpegPath = 'ffmpeg';
}

const videos = [
  {
    fileName: 'exploded view.mp4',
    folderName: 'exploded view',
    fps: 24, // 24 fps * 19.5s ≈ 470 кадров высокого качества
    quality: 80,
  },
  {
    fileName: '2 0 speed explosion view.mp4',
    folderName: '2 0 speed explosion view',
    fps: 24, // 24 fps * 10s ≈ 240 кадров
    quality: 80,
  }
];

const videosDir = path.resolve(__dirname, '../public/videos');

for (const video of videos) {
  const inputFilePath = path.join(videosDir, video.fileName);
  const outputDir = path.join(videosDir, video.folderName, 'frames');

  if (!fs.existsSync(inputFilePath)) {
    console.warn(`[SKIP] Файл не найден: ${inputFilePath}`);
    continue;
  }

  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`\nОбработка: "${video.fileName}" -> "${outputDir}"`);

  // Шаблон имени: frame_0001.webp
  const outputPattern = path.join(outputDir, 'frame_%04d.webp');

  const args = [
    '-y',
    '-i', inputFilePath,
    '-vf', `fps=${video.fps}`,
    '-c:v', 'libwebp',
    '-quality', String(video.quality),
    '-compression_level', '4',
    outputPattern
  ];

  const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error(`[ERROR] Ошибка конвертации для: ${video.fileName}`);
  } else {
    const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webp'));
    console.log(`[OK] Завершено! Экспортировано кадров: ${files.length}`);
  }
}
