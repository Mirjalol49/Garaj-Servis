import { getCompanies } from './actions'
import { CreateCompanyForm } from './CreateCompanyForm'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default async function CompaniesPage() {
  const companies = await getCompanies()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage customer companies and fleets.</p>
        </div>
        <CreateCompanyForm />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact Person</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(!companies || companies.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  No companies found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
            {companies?.map((company) => (
              <TableRow key={company.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.contact_person || '-'}</TableCell>
                <TableCell>{company.phone || '-'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${company.active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {company.active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
