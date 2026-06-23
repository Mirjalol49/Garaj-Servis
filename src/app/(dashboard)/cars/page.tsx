import { getCars } from './actions'
import { getCompanies } from '../companies/actions'
import { CreateCarForm } from './CreateCarForm'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function CarsPage() {
  const [cars, companies] = await Promise.all([
    getCars(),
    getCompanies(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cars</h1>
          <p className="text-muted-foreground">Manage cars and view service histories.</p>
        </div>
        <CreateCarForm companies={companies || []} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Make/Model</TableHead>
              <TableHead>Odometer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!cars || cars.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No cars found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {cars?.map((car) => (
              <TableRow key={car.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium uppercase">{car.plate_number}</TableCell>
                <TableCell>{car.customer_companies?.name || 'Unknown'}</TableCell>
                <TableCell>{car.make} {car.model} {car.year ? `(${car.year})` : ''}</TableCell>
                <TableCell>{car.current_odometer ? `${car.current_odometer.toLocaleString()} km` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
