import { PrismaClient, Role, LayoutType, VideoSource } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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

  // Seed YouTube videos
  const videos = [
    {
      id: 'video-1',
      url: 'https://www.youtube.com/watch?v=EngW7tLk6R8',
      title: 'Video 1',
    },
    {
      id: 'video-2',
      url: 'https://www.youtube.com/watch?v=a3ICNMQW7Ok',
      title: 'Video 2',
    },
    {
      id: 'video-3',
      url: 'https://www.youtube.com/watch?v=K4TOrB7at0Y',
      title: 'Video 3',
    },
    {
      id: 'video-4',
      url: 'https://www.youtube.com/watch?v=OHz0xIR8uwI',
      title: 'Video 4',
    },
    {
      id: 'video-5',
      url: 'https://www.youtube.com/watch?v=O5O3yK8DJCc',
      title: 'Video 5',
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
        source: VideoSource.YOUTUBE,
      },
    });
  }
  console.log(`Created ${videos.length} YouTube videos`);

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
  });
