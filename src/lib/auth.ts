import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin"; // <--- NEW IMPORT
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: AuthOptions = {
  providers: [
    // --- GOOGLE PROVIDER ---
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    // --- NEW: LINKEDIN PROVIDER ---
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: { scope: 'openid profile email' },
      },
      issuer: 'https://www.linkedin.com',
      jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
      profile(profile, tokens) {
        const defaultImage =
          'https://cdn-icons-png.flaticon.com/512/174/174857.png';
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture || defaultImage,
        };
      },
    }),
    
    // Existing Credentials Provider
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Check if user exists AND has a password (users created via Social Logins won't have one)
        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      }
    })
  ],
  callbacks: {
    // 1. Handle Auto-Registration for Social Users (Google & LinkedIn)
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "linkedin") {
        try {
          if (!user.email) return false; 
          
          const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
          
          if (!existingUser) {
            // Create new user automatically
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                role: "VIEWER", // Default role
                // passwordHash remains null
              }
            });
          }
          return true;
        } catch (error) {
          console.error("Error saving social user", error);
          return false;
        }
      }
      return true;
    },

    // 2. Ensure Role & ID are passed to the session
    async jwt({ token, user }) {
      if (user && user.email) {
         const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
         if (dbUser) {
             token.id = dbUser.id;
             token.role = dbUser.role;
         }
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};