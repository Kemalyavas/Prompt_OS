import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Hangi sayfaların koruma altında olacağını belirtiyoruz.
// Bu örnekte /dashboard ve altındaki tüm sayfalar korunacak.
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  // Eğer sayfa korumalıysa ve kullanıcı giriş yapmamışsa,
  // onu giriş sayfasına yönlendir.
  if (isProtectedRoute(req)) {
    const session = await auth();
    if (!session.userId) {
      return session.redirectToSignIn();
    }
  }
});

export const config = {
  matcher: [
    // Middleware'in hangi sayfalarda çalışacağını belirtir.
    // Statik dosyaları ve _next klasörünü hariç tutar.
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};