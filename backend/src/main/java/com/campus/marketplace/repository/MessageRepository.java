package com.campus.marketplace.repository;

import com.campus.marketplace.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    @Query("SELECT m FROM Message m WHERE (m.sender.id = :u1 AND m.receiver.id = :u2) OR (m.sender.id = :u2 AND m.receiver.id = :u1) ORDER BY m.createdAt ASC")
    List<Message> findChatHistory(@Param("u1") Long user1Id, @Param("u2") Long user2Id);

    List<Message> findByReceiverIdAndIsReadFalse(Long receiverId);

    @Query("SELECT DISTINCT m.sender.id FROM Message m WHERE m.receiver.id = :userId UNION SELECT DISTINCT m.receiver.id FROM Message m WHERE m.sender.id = :userId")
    List<Long> findActiveChatUserIds(@Param("userId") Long userId);
}
