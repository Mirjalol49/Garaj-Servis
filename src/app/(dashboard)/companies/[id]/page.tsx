import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from('customer_companies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !company) {
    notFound()
  }

  const { data: cars } = await supabase
    .from('cars')
    .select('*')
    .eq('customer_company_id', company.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{company.name}</h1>
        <p className="text-muted-foreground">Company Details</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact Person</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.contact_person || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.phone || 'N/A'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{company.billing_terms || 'Standard'}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold tracking-tight mt-8">Fleet Vehicles</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plate</TableHead>
              <TableHead>Make/Model</TableHead>
              <TableHead>Odometer</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!cars || cars.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                  No cars found for this company.
                </TableCell>
              </TableRow>
            )}
            {cars?.map((car) => (
              <TableRow key={car.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium uppercase">
                  <Link href={`/cars/${car.id}`} className="hover:underline">{car.plate_number}</Link>
                </TableCell>
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
