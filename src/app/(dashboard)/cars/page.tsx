import Image from 'next/image'
import Link from 'next/link'
import { getCarProfileImageUrls, getCars } from './actions'
import { getCompanies } from '../companies/actions'
import { CreateCarForm } from './CreateCarForm'
import { CarRowActions } from './CarRowActions'
import { CarIcon } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function CarsPage() {
  const [cars, companies] = await Promise.all([
    getCars(),
    getCompanies(),
  ])
  const imageUrls = await getCarProfileImageUrls((cars ?? []).map((car) => car.profile_image_path).filter(Boolean))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cars</h1>
          <p className="text-muted-foreground">Manage cars and view service histories.</p>
        </div>
        <CreateCarForm companies={companies || []} />
      </div>

      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Car</TableHead>
              <TableHead>Plate</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Make/Model</TableHead>
              <TableHead>Odometer</TableHead>
              <TableHead className="w-36 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!cars || cars.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No cars found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {cars?.map((car) => {
              const profileImageUrl = car.profile_image_path
                ? imageUrls[car.profile_image_path] ?? undefined
                : undefined

              return (
                <TableRow key={car.id} className="group hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Link href={`/cars/${car.id}`} className="flex items-center gap-3 hover:underline">
                      <span className="relative flex h-10 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted text-muted-foreground">
                        {profileImageUrl ? (
                          <Image
                            src={profileImageUrl}
                            alt={car.car_name || car.plate_number || 'Car profile image'}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <CarIcon className="h-5 w-5 opacity-50" />
                        )}
                      </span>
                      <span className="font-medium">{car.car_name || car.plate_number || 'Unnamed car'}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium uppercase">{car.plate_number || '-'}</TableCell>
                  <TableCell>
                    <div>{car.customer_companies?.name || 'No company'}</div>
                  </TableCell>
                  <TableCell>{[car.make, car.model].filter(Boolean).join(' ') || '-'} {car.year ? `(${car.year})` : ''}</TableCell>
                  <TableCell>{car.current_odometer ? `${car.current_odometer.toLocaleString()} km` : '-'}</TableCell>
                  <TableCell className="text-right">
                    <CarRowActions
                      companies={companies || []}
                      car={{
                        id: car.id,
                        customer_company_id: car.customer_company_id,
                        car_name: car.car_name,
                        profile_image_url: profileImageUrl,
                        plate_number: car.plate_number,
                        owner_phone: car.owner_phone,
                        make: car.make,
                        model: car.model,
                        year: car.year,
                        current_odometer: car.current_odometer,
                        notes: car.notes,
                        profile_image_path: car.profile_image_path,
                      }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
