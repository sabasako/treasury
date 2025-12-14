import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Transaction } from './Dashboard';
import { ArrowUpCircle, ArrowDownCircle, Coffee, ShoppingBag, Car, Tv, Banknote, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionListProps {
  transactions: Transaction[];
}

const categoryIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee className="h-4 w-4" />,
  food: <Banknote className="h-4 w-4" />,
  transport: <Car className="h-4 w-4" />,
  entertainment: <Tv className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  utilities: <Zap className="h-4 w-4" />,
};

export function TransactionList({ transactions }: TransactionListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No transactions yet. Add your first transaction above!
            </p>
          ) : (
            transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      transaction.type === 'income'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {categoryIcons[transaction.category] || <Banknote className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString()} • {transaction.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}$
                    {transaction.amount.toFixed(2)}
                  </span>
                  {transaction.type === 'income' ? (
                    <ArrowUpCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
