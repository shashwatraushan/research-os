import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { Provider } from "next-auth/providers/index";

// --- 1. Define Providers Dynamically ---
const providers: Provider[] = [
  // Credentials Provider (Always active)
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

      if (!user || !user.passwordHash) return null;

      const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!isValid) return null;

      return { id: user.id, email: user.email, name: user.name, role: user.role };
    }
  })
];

// Add Google (Only if keys exist to prevent crashes)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

// Add LinkedIn (Only if keys exist to prevent crashes)
if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  providers.push(
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      authorization: {
        params: { scope: 'openid profile email' },
      },
      issuer: 'https://www.linkedin.com',
      jwks_endpoint: 'https://www.linkedin.com/oauth/openid/jwks',
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture || 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
        };
      },
    })
  );
}

// --- 2. Auth Configuration ---
export const authOptions: AuthOptions = {
  providers: providers,
  callbacks: {
    async signIn({ user, account }) {
      // Handle Social Login Registration (Google & LinkedIn)
      if (account?.provider === "google" || account?.provider === "linkedin") {
        try {
          if (!user.email) return false;
          
          const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
          
          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
                role: "OWNER", // Default new users to OWNER so they can create projects
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