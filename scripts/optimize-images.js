#!/usr/bin/env node

import { stat, access } from 'fs/promises';
import { join, basename } from 'path';
import sharp from 'sharp';

const publicImagesDir = 'public/assets/images';

async function optimizeImage(inputPath, outputPath, options = {}) {
  try {
    const { width, height, quality = 85, format } = options;
    
    // If input and output are the same, use a temporary file
    const isSameFile = inputPath === outputPath;
    const tempPath = isSameFile ? `${outputPath}.tmp` : outputPath;
    
    let pipeline = sharp(inputPath);
    
    // Resize if dimensions specified
    if (width || height) {
      pipeline = pipeline.resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      });
    }
    
    // Convert to specified format or optimize existing format
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'avif') {
      pipeline = pipeline.avif({ quality });
    } else if (inputPath.toLowerCase().endsWith('.jpg') || inputPath.toLowerCase().endsWith('.jpeg')) {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (inputPath.toLowerCase().endsWith('.png')) {
      pipeline = pipeline.png({ quality, compressionLevel: 9 });
    }
    
    await pipeline.toFile(tempPath);
    
    // If we used a temp file, replace the original
    if (isSameFile) {
      const { rename } = await import('fs/promises');
      await rename(tempPath, outputPath);
    }
    
    const originalStats = await stat(inputPath);
    const optimizedStats = await stat(outputPath);
    const savings = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1);
    
    console.log(`✅ ${basename(inputPath)} → ${basename(outputPath)}`);
    console.log(`   ${(originalStats.size / 1024).toFixed(1)}KB → ${(optimizedStats.size / 1024).toFixed(1)}KB (${savings}% savings)`);
    
  } catch (error) {
    console.error(`❌ Error optimizing ${inputPath}:`, error.message);
  }
}

async function optimizeImages() {
  console.log('🖼️  Optimizing images...\n');
  
  const optimizations = [
    // Favicon optimizations (these should be tiny!)
    {
      input: join(publicImagesDir, 'favicon-16x16.png'),
      output: join(publicImagesDir, 'favicon-16x16.png'),
      options: { width: 16, height: 16, quality: 95 }
    },
    {
      input: join(publicImagesDir, 'favicon-32x32.png'),
      output: join(publicImagesDir, 'favicon-32x32.png'),
      options: { width: 32, height: 32, quality: 95 }
    },
    {
      input: join(publicImagesDir, 'favicon.png'),
      output: join(publicImagesDir, 'favicon.png'),
      options: { width: 64, height: 64, quality: 95 }
    },
    {
      input: join(publicImagesDir, 'icon-192x192.png'),
      output: join(publicImagesDir, 'icon-192x192.png'),
      options: { width: 192, height: 192, quality: 90 }
    },
    {
      input: join(publicImagesDir, 'icon-512x512.png'),
      output: join(publicImagesDir, 'icon-512x512.png'),
      options: { width: 512, height: 512, quality: 90 }
    },
    
    // Profile images
    {
      input: join(publicImagesDir, 'china-profile-picture.jpg'),
      output: join(publicImagesDir, 'china-profile-picture.jpg'),
      options: { width: 800, height: 800, quality: 80 }
    },
    {
      input: join(publicImagesDir, 'Blake-O-scaled.jpg'),
      output: join(publicImagesDir, 'Blake-O-scaled.jpg'),
      options: { width: 800, height: 800, quality: 80 }
    },
    
    // OG image
    {
      input: join(publicImagesDir, 'og-image.jpg'),
      output: join(publicImagesDir, 'og-image.jpg'),
      options: { width: 1200, height: 630, quality: 85 }
    },
    
    // Create WebP versions for modern browsers
    {
      input: join(publicImagesDir, 'china-profile-picture.jpg'),
      output: join(publicImagesDir, 'china-profile-picture.webp'),
      options: { width: 800, height: 800, quality: 80, format: 'webp' }
    },
    {
      input: join(publicImagesDir, 'Blake-O-scaled.jpg'),
      output: join(publicImagesDir, 'Blake-O-scaled.webp'),
      options: { width: 800, height: 800, quality: 80, format: 'webp' }
    },
    
    // Optimize Python logo
    {
      input: join(publicImagesDir, 'proficiencies/python_logo.png'),
      output: join(publicImagesDir, 'proficiencies/python_logo.webp'),
      options: { width: 64, height: 64, quality: 85, format: 'webp' }
    }
  ];
  
  for (const { input, output, options } of optimizations) {
    try {
      await access(input);
      await optimizeImage(input, output, options);
    } catch {
      console.log(`⚠️  Skipping ${input} (file not found)`);
    }
  }
  
  console.log('\n🎉 Image optimization complete!');
}

optimizeImages().catch(console.error);
