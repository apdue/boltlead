"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface LeadDataTableProps {
  data: any[];
}

export function LeadDataTable({ data }: LeadDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No lead data available</p>
      </div>
    );
  }
  
  // Get all unique field names from the data
  const allFields = new Set<string>();
  data.forEach(lead => {
    if (lead.field_data) {
      lead.field_data.forEach((field: any) => {
        allFields.add(field.name);
      });
    }
  });
  
  const fieldNames = Array.from(allFields);
  
  // Filter data based on search term
  const filteredData = data.filter(lead => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in created_time
    if (lead.created_time && lead.created_time.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in field_data
    if (lead.field_data) {
      return lead.field_data.some((field: any) => 
        (field.name && field.name.toLowerCase().includes(searchLower)) ||
        (field.values && field.values.some((value: string) => 
          value.toLowerCase().includes(searchLower)
        ))
      );
    }
    
    return false;
  });
  
  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);
  
  // Helper function to get field value
  const getFieldValue = (lead: any, fieldName: string) => {
    if (!lead.field_data) return '';
    
    const field = lead.field_data.find((f: any) => f.name === fieldName);
    if (!field || !field.values) return '';
    
    return field.values.join(', ');
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Created Time</TableHead>
              {fieldNames.map(fieldName => (
                <TableHead key={fieldName}>{fieldName}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((lead, index) => (
              <TableRow key={lead.id || index}>
                <TableCell>
                  {new Date(lead.created_time).toLocaleString()}
                </TableCell>
                {fieldNames.map(fieldName => (
                  <TableCell key={fieldName}>
                    {getFieldValue(lead, fieldName)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length} leads
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}