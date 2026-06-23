import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function CarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: car, error } = await supabase
    .from('cars')
    .select('*, customer_companies(name, id)')
    .eq('id', id)
    .single()

  if (error || !car) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight uppercase">{car.plate_number}</h1>
        <p className="text-muted-foreground">
          Owned by <Link href={`/companies/${car.customer_companies?.id}`} className="hover:underline text-primary">{car.customer_companies?.name}</Link>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Make / Model</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{car.make || 'N/A'} {car.model}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Year</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{car.year || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Color</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{car.color || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Odometer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{car.current_odometer ? `${car.current_odometer.toLocaleString()} km` : 'N/A'}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
