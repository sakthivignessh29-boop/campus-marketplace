package com.campus.marketplace.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Donation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "beneficiary_id")
    private User beneficiary;

    @Enumerated(EnumType.STRING)
    @Column(name = "tracking_status", nullable = false)
    @Builder.Default
    private DonationStatus trackingStatus = DonationStatus.SUBMITTED;

    @Column(name = "impact_co2")
    private Double impactCo2; // in kg

    @Column(name = "impact_waste")
    private Double impactWaste; // in kg

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (trackingStatus == null) {
            trackingStatus = DonationStatus.SUBMITTED;
        }
    }
}
