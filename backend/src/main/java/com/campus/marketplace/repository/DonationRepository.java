package com.campus.marketplace.repository;

import com.campus.marketplace.model.Donation;
import com.campus.marketplace.model.DonationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByDonorId(Long donorId);
    List<Donation> findByBeneficiaryId(Long beneficiaryId);
    List<Donation> findByTrackingStatus(DonationStatus status);
}
