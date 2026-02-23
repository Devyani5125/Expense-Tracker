"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Expense, categoryIcons } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ExpenseForm } from "./expense-form";
import { Badge } from "./ui/badge";

interface ExpenseTableProps {
  expenses: Expense[];
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  currency?: string;
}

export function ExpenseTable({ expenses, onUpdateExpense, onDeleteExpense, currency }: ExpenseTableProps) {
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = React.useState<string | null>(null);

  const handleDelete = () => {
    if (deletingExpenseId) {
      onDeleteExpense(deletingExpenseId);
      setDeletingExpenseId(null);
    }
  };

  const Icon = ({ category }: { category: Expense['category'] }) => {
    const Cmp = categoryIcons[category];
    return <Cmp className="h-4 w-4" />;
  };

  return (
    <>
      <div className="relative w-full overflow-auto h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Cat.</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    <div className="flex items-center justify-center p-2 rounded-sm bg-muted text-muted-foreground">
                      <Icon category={expense.category} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{expense.title}</div>
                    <Badge variant="outline">{expense.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(expense.amount, currency)}</TableCell>
                  <TableCell>{format(expense.date, 'PP')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingExpense(expense)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingExpenseId(expense.id)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No expenses found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {editingExpense && (
        <ExpenseForm
          isOpen={!!editingExpense}
          onClose={() => setEditingExpense(null)}
          onSubmit={(data) => {
            onUpdateExpense({ ...editingExpense, ...data });
          }}
          initialData={editingExpense}
        />
      )}

      <AlertDialog open={!!deletingExpenseId} onOpenChange={(open) => !open && setDeletingExpenseId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this expense record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
