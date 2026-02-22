import { prisma } from '../config/prisma.js'

export async function createShopOrder(userId, payload) {
  const shop = await prisma.shop.upsert({
    where: { userId_name: { userId, name: payload.shopName } },
    update: { location: payload.shopLocation ?? null },
    create: {
      userId,
      name: payload.shopName,
      location: payload.shopLocation ?? null,
      externalId: payload.shopId
    }
  })

  return prisma.shopOrder.create({
    data: {
      userId,
      shopId: shop.id,
      shopName: payload.shopName,
      shopLocation: payload.shopLocation ?? null,
      orderExternalId: payload.orderId,
      orderDate: payload.orderDate,
      orderStatus: payload.orderStatus,
      totalAmountMinor: BigInt(payload.totalAmount),
      paymentReference: payload.paymentReference,
      currency: payload.currency,
      items: {
        create: payload.items.map((item) => ({
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          unitPriceMinor: BigInt(item.unitPrice),
          totalPriceMinor: BigInt(item.totalPrice)
        }))
      }
    },
    include: { items: true }
  })
}

export async function createTrip(userId, payload) {
  const [vehicle, driver] = await Promise.all([
    payload.vehicleNumber ? prisma.vehicle.upsert({
      where: { vehicleNumber: payload.vehicleNumber },
      update: { vehicleType: payload.vehicleType },
      create: { vehicleType: payload.vehicleType, vehicleNumber: payload.vehicleNumber }
    }) : Promise.resolve(null),
    payload.driverId ? prisma.driver.upsert({
      where: { externalDriverId: payload.driverId },
      update: { name: payload.driverName },
      create: { externalDriverId: payload.driverId, name: payload.driverName }
    }) : Promise.resolve(null)
  ])

  return prisma.trip.create({
    data: {
      userId,
      pickupLocationText: payload.pickupLocationText,
      pickupLatitude: payload.pickupLatitude,
      pickupLongitude: payload.pickupLongitude,
      dropLocationText: payload.dropLocationText,
      dropLatitude: payload.dropLatitude,
      dropLongitude: payload.dropLongitude,
      distanceEstimateKm: payload.distanceEstimate,
      fareEstimateMinor: payload.fareEstimate ? BigInt(payload.fareEstimate) : null,
      actualFareMinor: payload.actualFare ? BigInt(payload.actualFare) : null,
      tripStatus: payload.tripStatus,
      tripDate: payload.tripDate,
      vehicleId: vehicle?.id,
      driverId: driver?.id
    },
    include: { vehicle: true, driver: true }
  })
}
