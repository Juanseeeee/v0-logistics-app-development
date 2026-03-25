"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts"
import { Badge } from "@/components/ui/badge"

interface HubChartsClientProps {
  monthlyFuelData: any[]
  clientProfitData: any[]
  upcomingMaintenances: any[]
}

export function HubChartsClient({ monthlyFuelData, clientProfitData, upcomingMaintenances }: HubChartsClientProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 max-w-5xl mx-auto mt-8">
      {/* Monthly Fuel Costs */}
      <Card className="col-span-1 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Gastos de Combustible</CardTitle>
          <CardDescription>Últimos meses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyFuelData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Gastos"]}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Gastos" 
                  stroke="#0038ae" 
                  strokeWidth={3}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Profits by Client */}
      <Card className="col-span-1 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Ganancias por Cliente</CardTitle>
          <CardDescription>Top 5 clientes con mayor rentabilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clientProfitData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Ganancia"]}
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))" }}
                />
                <Bar dataKey="Ganancia" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Maintenances */}
      <Card className="col-span-1 lg:col-span-2 shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Mantenimientos Próximos</CardTitle>
          <CardDescription>Alertas que requieren atención</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingMaintenances.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No hay alertas de mantenimiento próximas.</p>
          ) : (
            <div className="space-y-4">
              {upcomingMaintenances.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                  <div>
                    <p className="font-medium">{alert.vehicles?.patent_chasis || "Vehículo Desconocido"}</p>
                    <p className="text-sm text-muted-foreground">{alert.description}</p>
                  </div>
                  <Badge variant={alert.urgency_level === 1 ? "destructive" : alert.urgency_level === 2 ? "default" : "secondary"}>
                    {alert.urgency_level === 1 ? "Urgente" : alert.urgency_level === 2 ? "Media" : "Baja"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
