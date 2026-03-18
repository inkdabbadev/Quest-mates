import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'PIN Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        pin: { label: 'PIN', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.pin) return null;

        await connectDB();
        const user = await User.findOne({
          username: credentials.username.toLowerCase(),
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(credentials.pin, user.pinHash);
        if (!isValid) return null;

        return {
          id: user._id.toString(),
          username: user.username,
          name: user.name,
          emoji: user.emoji,
          color: user.color,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username: string }).username;
        token.name = user.name ?? '';
        token.emoji = (user as { emoji: string }).emoji;
        token.color = (user as { color: string }).color;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.username = token.username as 'bhuvi' | 'karthic';
      session.user.name = token.name as string;
      session.user.emoji = token.emoji as string;
      session.user.color = token.color as string;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
};
