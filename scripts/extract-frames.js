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
    candidateNames: [
      'video centered 2 .mp4',
      'first baner centered.mp4',
      'nami video first.mp4',
      'baner 1.mp4',
      'banner 1.mp4',
      'Banner.1.mp4'
    ],
    folderName: 'Banner.1',
    targetFrames: 120,
    fps: '20',
    quality: 95,
  },
  {
    candidateNames: [
      'nami video second.mp4',
      'banner 2.mp4',
      'baner 2.mp4',
      'Banner.2.mp4',
      'exploded view.mp4'
    ],
    folderName: 'Banner.2',
    targetFrames: 160,
    fps: '160/15.95',
    quality: 92,
  }
];

const candidateSearchDirs = [
  path.resolve(__dirname, '../.public backup/videos'),
  path.resolve(__dirname, '../public/videos'),
  path.resolve(__dirname, '..')
];

function findSourceFile(candidateNames) {
  for (const dir of candidateSearchDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of candidateNames) {
      const fullPath = path.join(dir, name);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
  }
  return null;
}

const targetArg = process.argv[2]?.trim().toLowerCase();
const filteredVideos = targetArg
  ? videos.filter(v => v.folderName.toLowerCase() === targetArg)
  : videos;
const targetBaseDir = path.resolve(__dirname, '../public/videos');

for (const video of filteredVideos) {
  const inputFilePath = findSourceFile(video.candidateNames);
  const outputDir = path.join(targetBaseDir, video.folderName, 'frames');

  if (!inputFilePath) {
    console.warn(`[SKIP] Исходный файл не найден для секции "${video.folderName}" (поиск: ${video.candidateNames.join(', ')})`);
    continue;
  }

  console.log(`\n==================================================`);
  console.log(`Обработка: "${path.basename(inputFilePath)}" -> "${video.folderName}"`);
  console.log(`Качество WebP: ${video.quality}, целевой FPS: ${video.fps}`);
  console.log(`==================================================`);

  if (fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPattern = path.join(outputDir, 'frame_%04d.webp');

  const args = [
    '-y',
    '-i', inputFilePath,
    '-vf', `fps=${video.fps}`,
    '-c:v', 'libwebp',
    '-quality', String(video.quality),
    '-compression_level', '5',
    outputPattern
  ];

  const result = spawnSync(ffmpegPath, args, { stdio: 'inherit' });

  if (result.status !== 0) {
    console.error(`[ERROR] Ошибка конвертации для: ${video.folderName}`);
  } else {
    let files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webp')).sort();

    // Если получилось больше целевого числа кадров (на 1-2 кадра из-за округления длительности), обрезаем лишние
    if (video.targetFrames && files.length > video.targetFrames) {
      const excess = files.slice(video.targetFrames);
      for (const extra of excess) {
        fs.unlinkSync(path.join(outputDir, extra));
      }
      files = fs.readdirSync(outputDir).filter(f => f.endsWith('.webp')).sort();
    }

    let totalBytes = 0;
    for (const f of files) {
      totalBytes += fs.statSync(path.join(outputDir, f)).size;
    }

    const avgKb = files.length > 0 ? (totalBytes / files.length / 1024).toFixed(1) : 0;
    const totalMb = (totalBytes / 1024 / 1024).toFixed(2);

    console.log(`[OK] Завершено! Экспортировано кадров: ${files.length}`);
    console.log(`[STATS] Средний вес кадра: ${avgKb} KB | Общий объем: ${totalMb} MB`);
  }
}
