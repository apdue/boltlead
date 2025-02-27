"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface Page {
  id: string;
  name: string;
  access_token: string;
  accountId: string;
  isPermanent: boolean;
}

interface PermanentPagesProps {
  onPageSelected: (page: Page) => void;
  accounts: Array<{ id: string; name: string }>;
}

export function PermanentPages({ onPageSelected, accounts }: PermanentPagesProps) {
  const [permanentPages, setPermanentPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const fetchPermanentPages = async () => {
    if (!mounted) return;

    try {
      setLoading(true);
      const response = await fetch('/api/accounts/permanent-pages');
      
      if (!response.ok) {
        throw new Error('Failed to fetch permanent pages');
      }
      
      const data = await response.json();
      setPermanentPages(data.pages || []);
    } catch (error) {
      console.error('Error fetching permanent pages:', error);
      toast.error('Failed to load permanent pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchPermanentPages();
    }
  }, [mounted]);

  const handleDeletePage = async (pageId: string) => {
    if (!mounted) return;

    try {
      setDeleteLoading(pageId);
      
      const response = await fetch('/api/accounts/permanent-pages', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete permanent page');
      }
      
      // Remove the page from the state
      setPermanentPages(permanentPages.filter(page => page.id !== pageId));
      toast.success('Page removed from permanent storage');
    } catch (error) {
      console.error('Error deleting permanent page:', error);
      toast.error('Failed to delete permanent page');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    return account ? account.name : 'Unknown Account';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permanent Pages</CardTitle>
        <CardDescription>Pages that are saved permanently</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : permanentPages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No permanent pages found. Mark pages as permanent when adding them.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Name</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Page ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permanentPages.map((page) => (
                <TableRow key={page.id}>
                  <TableCell className="font-medium">{page.name}</TableCell>
                  <TableCell>{getAccountName(page.accountId)}</TableCell>
                  <TableCell>{page.id}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onPageSelected(page)}
                      >
                        Select
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={deleteLoading === page.id}
                          >
                            {deleteLoading === page.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove "{page.name}" from permanent storage. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePage(page.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 