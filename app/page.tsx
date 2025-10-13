import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">CatAssist</h1>
        <p className="mt-2 text-muted-foreground">
          Next.js + Tailwind + shadcn/ui is now working perfectly.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Button>Open Dashboard</Button>
            <Button variant="outline">Learn More</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild size="sm" variant="secondary">
              <a href="https://nextjs.org/docs" target="_blank" rel="noreferrer">Next.js Docs</a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href="https://ui.shadcn.com" target="_blank" rel="noreferrer">shadcn/ui</a>
            </Button>
            <Button asChild size="sm" variant="secondary">
              <a href="https://tailwindcss.com/docs" target="_blank" rel="noreferrer">Tailwind Docs</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
