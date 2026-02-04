import 'dotenv/config';
import { PrismaClient, Role, LayoutType, VideoSource } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Create PostgreSQL connection pool with SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@runads.com' },
    update: {},
    create: {
      email: 'admin@runads.com',
      password: adminPassword,
      role: Role.ADMIN,
      name: 'Admin User',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create default fullscreen layout
  const layout = await prisma.layout.upsert({
    where: { id: 'default-fullscreen' },
    update: {},
    create: {
      id: 'default-fullscreen',
      name: 'Default Fullscreen',
      type: LayoutType.FULLSCREEN,
      config: JSON.stringify({ backgroundColor: '#000000' }),
    },
  });
  console.log('Created default layout:', layout.name);

  // Seed YouTube videos with thumbnails
  const videos = [
    {
      id: 'Sample Dummy Video',
      url: 'https://www.youtube.com/watch?v=EngW7tLk6R8',
      title: 'Sample Dummy Video',
      thumbnail: 'https://img.youtube.com/vi/EngW7tLk6R8/maxresdefault.jpg',
      duration: 30,
    },
    {
      id: 'Windows Horse Running Video',
      url: 'https://www.youtube.com/watch?v=a3ICNMQW7Ok',
      title: 'Windows Horse Running Video',
      thumbnail: 'https://img.youtube.com/vi/a3ICNMQW7Ok/maxresdefault.jpg',
      duration: 15,
    },
    {
      id: 'Bokeh Blue',
      url: 'https://www.youtube.com/watch?v=K4TOrB7at0Y',
      title: 'Bokeh Blue Background',
      thumbnail: 'https://img.youtube.com/vi/K4TOrB7at0Y/maxresdefault.jpg',
      duration: 60,
    },
    {
      id: 'Intro Video Sample',
      url: 'https://www.youtube.com/watch?v=OHz0xIR8uwI',
      title: 'Intro Video Sample',
      thumbnail: 'https://img.youtube.com/vi/OHz0xIR8uwI/maxresdefault.jpg',
      duration: 20,
    },
    {
      id: 'Sony Alpha 4k Video',
      url: 'https://www.youtube.com/watch?v=O5O3yK8DJCc',
      title: 'Sony Alpha 4K Demo',
      thumbnail: 'https://img.youtube.com/vi/O5O3yK8DJCc/maxresdefault.jpg',
      duration: 45,
    },
  ];

  for (const video of videos) {
    await prisma.video.upsert({
      where: { id: video.id },
      update: {},
      create: {
        id: video.id,
        url: video.url,
        title: video.title,
        thumbnail: video.thumbnail,
        duration: video.duration,
        source: VideoSource.YOUTUBE,
      },
    });
  }
  console.log(`Created ${videos.length} YouTube videos with thumbnails`);

  // Create a sample client user
  const clientPassword = await bcrypt.hash('client123', 10);
  const clientUser = await prisma.user.upsert({
    where: { loginId: 'DISPLAY001' },
    update: {},
    create: {
      loginId: 'DISPLAY001',
      password: clientPassword,
      role: Role.CLIENT,
      name: 'Display Client 1',
    },
  });

  // Create client profile
  const client = await prisma.client.upsert({
    where: { userId: clientUser.id },
    update: {},
    create: {
      name: 'Lobby Display',
      description: 'Main lobby display screen',
      location: 'Building A - Lobby',
      userId: clientUser.id,
      layoutId: layout.id,
    },
  });
  console.log('Created sample client:', client.name);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
