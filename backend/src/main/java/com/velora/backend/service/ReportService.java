package com.velora.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.velora.backend.dto.ReportDtos.Bucket;
import com.velora.backend.dto.ReportDtos.Period;
import com.velora.backend.dto.ReportDtos.SalesReport;
import com.velora.backend.dto.ReportDtos.Summary;
import com.velora.backend.dto.ReportDtos.TopProduct;
import com.velora.backend.entity.Order;
import com.velora.backend.entity.OrderItem;
import com.velora.backend.entity.OrderStatus;
import com.velora.backend.repository.OrderRepository;

/**
 * The admin "Sales report": sales and orders per day / week / month.
 * Only orders that are SHIPPED or DELIVERED count as sales (pending, confirmed and cancelled don't). Days are counted in the store's time zone (Lebanon).
 */
@Service
@Transactional(readOnly = true)
public class ReportService {

    /** The statuses that count as a real sale. */
    private static final List<OrderStatus> SOLD = List.of(OrderStatus.SHIPPED, OrderStatus.DELIVERED);

    private final OrderRepository orderRepository;
    private final ZoneId zone;

    public ReportService(OrderRepository orderRepository, @Value("${velora.timezone}") String timezone) {
        this.orderRepository = orderRepository;
        this.zone = ZoneId.of(timezone);
    }

    public SalesReport sales(Period period) {
        // How many bars: last 30 days, 12 weeks or 12 months
        int count = switch (period) {
            case DAY -> 30;
            case WEEK, MONTH -> 12;
        };
        LocalDate currentStart = bucketStart(LocalDate.now(zone), period);

        // Empty buckets first (so days with no sales still show as 0), oldest -> newest
        Map<LocalDate, Totals> buckets = new LinkedHashMap<>();
        for (int i = count - 1; i >= 0; i--) {
            buckets.put(minus(currentStart, period, i), new Totals());
        }
        LocalDate firstStart = buckets.keySet().iterator().next();

        // Shipped + delivered orders since the first bar
        List<Order> orders = orderRepository.findByCreatedAtGreaterThanEqualAndStatusIn(
                firstStart.atStartOfDay(zone).toInstant(), SOLD);

        Map<String, TopTotals> products = new HashMap<>();
        Totals total = new Totals();
        for (Order o : orders) {
            LocalDate day = o.getCreatedAt().atZone(zone).toLocalDate();
            Totals bucket = buckets.get(bucketStart(day, period));
            if (bucket == null) continue;
            int items = o.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
            bucket.add(o.getTotal(), items);
            total.add(o.getTotal(), items);
            for (OrderItem item : o.getItems()) {
                products.computeIfAbsent(item.getProductName(), k -> new TopTotals())
                        .add(item.getQuantity(), item.getLineTotal());
            }
        }

        List<Bucket> bucketList = new ArrayList<>();
        buckets.forEach((start, t) -> bucketList.add(new Bucket(start, t.orders, t.sales, t.items)));

        // "Previous" = the bar before the current one (yesterday / last week / last month)
        Totals current = buckets.get(currentStart);
        Totals previous = buckets.getOrDefault(minus(currentStart, period, 1), new Totals());

        List<TopProduct> top = products.entrySet().stream()
                .map(e -> new TopProduct(e.getKey(), e.getValue().quantity, e.getValue().sales))
                .sorted(Comparator.comparingLong(TopProduct::quantity).reversed()
                        .thenComparing(TopProduct::sales, Comparator.reverseOrder()))
                .limit(5)
                .toList();

        return new SalesReport(period, zone.getId(), bucketList,
                current.summary(), previous.summary(), total.summary(), top);
    }

    /** The first day of the day/week/month that contains this date. Weeks start on Monday. */
    private static LocalDate bucketStart(LocalDate date, Period period) {
        return switch (period) {
            case DAY -> date;
            case WEEK -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            case MONTH -> date.withDayOfMonth(1);
        };
    }

    private static LocalDate minus(LocalDate start, Period period, int n) {
        return switch (period) {
            case DAY -> start.minusDays(n);
            case WEEK -> start.minusWeeks(n);
            case MONTH -> start.minusMonths(n);
        };
    }

    /** Running totals for one bucket. */
    private static final class Totals {
        long orders;
        long items;
        BigDecimal sales = BigDecimal.ZERO;

        void add(BigDecimal amount, int itemCount) {
            orders++;
            items += itemCount;
            sales = sales.add(amount);
        }

        Summary summary() {
            BigDecimal average = orders == 0 ? BigDecimal.ZERO
                    : sales.divide(BigDecimal.valueOf(orders), 2, RoundingMode.HALF_UP);
            return new Summary(orders, sales, items, average);
        }
    }

    private static final class TopTotals {
        long quantity;
        BigDecimal sales = BigDecimal.ZERO;

        void add(int qty, BigDecimal amount) {
            quantity += qty;
            sales = sales.add(amount);
        }
    }
}
