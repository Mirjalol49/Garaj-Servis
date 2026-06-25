import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import Link from 'next/link'
import { getCarProfileImageUrls } from '../actions'

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
  const imageUrls = await getCarProfileImageUrls(car.profile_image_path ? [car.profile_image_path] : [])
  const imageUrl = car.profile_image_path ? imageUrls[car.profile_image_path] ?? undefined : undefined
  const title = car.car_name || car.plate_number || 'Unnamed car'

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-5">
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="128px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">
            {car.customer_companies ? (
              <>Owned by <Link href={`/companies/${car.customer_companies.id}`} className="hover:underline text-primary">{car.customer_companies.name}</Link></>
            ) : (
              'No company assigned'
            )}
          </p>
          {car.plate_number && <p className="font-mono text-sm uppercase text-muted-foreground">{car.plate_number}</p>}
        </div>
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
            <CardTitle className="text-sm font-medium">Owner Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{car.owner_phone || 'N/A'}</div>
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

      {car.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Car Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{car.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
