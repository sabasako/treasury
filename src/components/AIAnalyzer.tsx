import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Transaction } from './Dashboard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Coffee, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

interface AIAnalyzerProps {
  transactions: Transaction[];
  currentBalance: number;
}

export function AIAnalyzer({ transactions, currentBalance }: AIAnalyzerProps) {
  // Calculate balance over time
  const balanceOverTime = transactions
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .reduce((acc, transaction) => {
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].balance : 0;
      const newBalance =
        transaction.type === 'income'
          ? lastBalance + transaction.amount
          : lastBalance - transaction.amount;

      acc.push({
        date: transaction.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        balance: newBalance,
        actual: newBalance,
      });

      return acc;
    }, [] as { date: string; balance: number; actual: number }[]);

  // Calculate "what if" scenario without coffee expenses
  const coffeeExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.category === 'coffee'
  );
  const totalCoffeeSpent = coffeeExpenses.reduce((sum, t) => sum + t.amount, 0);

  const balanceWithoutCoffee = transactions
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .reduce((acc, transaction) => {
      const lastBalance = acc.length > 0 ? acc[acc.length - 1].withoutCoffee : 0;
      let newBalance = lastBalance;

      if (transaction.type === 'income') {
        newBalance = lastBalance + transaction.amount;
      } else if (transaction.category !== 'coffee') {
        newBalance = lastBalance - transaction.amount;
      } else {
        // Skip coffee expenses
        newBalance = lastBalance;
      }

      acc.push({
        date: transaction.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        withoutCoffee: newBalance,
      });

      return acc;
    }, [] as { date: string; withoutCoffee: number }[]);

  // Merge the data
  const chartData = balanceOverTime.map((item, index) => ({
    date: item.date,
    actual: item.balance,
    withoutCoffee: balanceWithoutCoffee[index]?.withoutCoffee || item.balance,
  }));

  const potentialSavings = balanceWithoutCoffee.length > 0
    ? balanceWithoutCoffee[balanceWithoutCoffee.length - 1].withoutCoffee - currentBalance
    : 0;

  // Calculate weekly coffee spending
  const weeklyCoffeeSpending = (totalCoffeeSpent / transactions.length) * 7;
  const yearlyCoffeeSavings = weeklyCoffeeSpending * 52;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Financial Insights</CardTitle>
          <CardDescription>
            See how your balance changed over time and discover potential savings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Actual Balance"
                />
                <Line
                  type="monotone"
                  dataKey="withoutCoffee"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Without Coffee"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Coffee Addiction Impact</CardTitle>
            <Coffee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl">${totalCoffeeSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total spent on coffee ({coffeeExpenses.length} transactions)
            </p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Projected yearly:</span>
                <span className="font-medium">${yearlyCoffeeSavings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Avg per purchase:</span>
                <span className="font-medium">
                  ${coffeeExpenses.length > 0 ? (totalCoffeeSpent / coffeeExpenses.length).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm">Potential Savings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-600">${potentialSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Extra balance if you skipped coffee
            </p>
            <div className="mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current balance:</span>
                <span className="font-medium">${currentBalance.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Possible balance:</span>
                <span className="font-medium text-green-600">
                  ${(currentBalance + potentialSavings).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {totalCoffeeSpent > 50 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>AI Insight</AlertTitle>
          <AlertDescription>
            You've spent <strong>${totalCoffeeSpent.toFixed(2)}</strong> on coffee. At this rate,
            you could save <strong>${yearlyCoffeeSavings.toFixed(2)}</strong> per year by making
            coffee at home! Consider brewing your own to boost your savings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
